"use server";

import { db } from "@/lib/db";
import {
    purchaseOrders,
    purchaseOrderItems,
    products,
    inventoryLogs,
    productVariants
} from "@/lib/schema/sedia-pos";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkPermission } from "@/lib/auth-checks";

export async function getPurchaseOrders(outletId: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) return { error: "Unauthorized" };

        const hasPermission = await checkPermission("manage_purchase_orders");
        if (!hasPermission) return { error: "Forbidden: Insufficient permissions" };

        const data = await db.query.purchaseOrders.findMany({
            where: eq(purchaseOrders.outletId, outletId),
            orderBy: [desc(purchaseOrders.createdAt)],
            with: {
                supplier: true,
                items: true,
            },
        });

        console.log(`[getPurchaseOrders] User: ${session.user.id}, Perm: ${hasPermission}, Outlet: ${outletId}, Count: ${data.length}`);
        return { data };
    } catch (error) {
        console.error("Failed to fetch purchase orders:", error);
        return { error: "Failed to fetch purchase orders" };
    }
}

export async function getPurchaseOrder(id: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) return { error: "Unauthorized" };

        const hasPermission = await checkPermission("manage_purchase_orders");
        if (!hasPermission) return { error: "Forbidden: Insufficient permissions" };

        const data = await db.query.purchaseOrders.findFirst({
            where: eq(purchaseOrders.id, id),
            with: {
                supplier: true,
                items: {
                    with: {
                        product: true,
                        variant: true,
                    }
                },
            },
        });

        if (!data) return { error: "Purchase Order not found" };

        return { data };
    } catch (error) {
        console.error("Failed to fetch purchase order:", error);
        return { error: "Failed to fetch purchase order" };
    }
}

type PurchaseOrderItemInput = {
    productId: string;
    variantId?: string | null;
    quantity: number;
    costPrice: number;
};

export async function createPurchaseOrder(data: {
    outletId: string;
    supplierId: string;
    notes?: string;
    items: PurchaseOrderItemInput[];
    orderDate?: Date;
    expectedDate?: Date;
}) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) return { error: "Unauthorized" };

        const hasPermission = await checkPermission("manage_purchase_orders");
        if (!hasPermission) return { error: "Forbidden: Insufficient permissions" };

        // Calculate total amount
        const totalAmount = data.items.reduce(
            (sum, item) => sum + item.quantity * item.costPrice,
            0
        );

        // Generate invoice number: PO-YYMMXXXX (resets monthly)
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');

        // Count POs in current month for this outlet
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        const count = await db.$count(
            purchaseOrders,
            and(
                eq(purchaseOrders.outletId, data.outletId),
                gte(purchaseOrders.orderDate, startOfMonth),
                lte(purchaseOrders.orderDate, endOfMonth)
            )
        );

        const sequence = (count + 1).toString().padStart(4, '0'); // XXXX
        const invoiceNumber = `PO-${year}${month}${sequence}`;

        // Transaction to create header and items
        // db.transaction not supported in neon-http, running sequentially
        const [newOrder] = await db
            .insert(purchaseOrders)
            .values({
                outletId: data.outletId,
                supplierId: data.supplierId,
                invoiceNumber,
                status: "draft",
                totalAmount,
                orderDate: data.orderDate || new Date(),
                expectedDate: data.expectedDate,
                notes: data.notes,
            })
            .returning();

        if (data.items.length > 0) {
            await db.insert(purchaseOrderItems).values(
                data.items.map((item) => ({
                    purchaseOrderId: newOrder.id,
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    costPrice: item.costPrice,
                    subtotal: item.quantity * item.costPrice,
                }))
            );
        }

        revalidatePath("/dashboard/purchase-orders");
        return { success: true };
    } catch (error) {
        console.error("Failed to create purchase order:", error);
        return { error: "Failed to create purchase order" };
    }
}

export async function updatePurchaseOrderStatus(
    id: string,
    status: "draft" | "ordered" | "cancelled"
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) return { error: "Unauthorized" };

        const hasPermission = await checkPermission("manage_purchase_orders");
        if (!hasPermission) return { error: "Forbidden: Insufficient permissions" };

        await db
            .update(purchaseOrders)
            .set({ status })
            .where(eq(purchaseOrders.id, id));

        revalidatePath(`/dashboard/purchase-orders/${id}`);
        revalidatePath("/dashboard/purchase-orders");
        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { error: "Failed to update status" };
    }
}

export async function receivePurchaseOrder(id: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) return { error: "Unauthorized" };

        const hasPermission = await checkPermission("manage_purchase_orders");
        if (!hasPermission) return { error: "Forbidden: Insufficient permissions" };

        const po = await db.query.purchaseOrders.findFirst({
            where: eq(purchaseOrders.id, id),
            with: {
                items: true,
            },
        });

        if (!po) return { error: "Purchase Order not found" };
        if (po.status === "received") return { error: "Purchase Order already received" };

        // Transactional update: Mark received AND update stock
        // db.transaction not supported in neon-http, running sequentially

        // 1. Update PO status
        await db
            .update(purchaseOrders)
            .set({
                status: "received",
                receivedDate: new Date(),
            })
            .where(eq(purchaseOrders.id, id));

        // 2. Loop through items to update stock + log inventory
        for (const item of po.items) {
            // Update Product Stock
            if (!item.variantId) {
                await db
                    .update(products)
                    .set({
                        stock: sql`${products.stock} + ${item.quantity}`,
                        costPrice: item.costPrice.toString(), // Update logic for cost price? Last price or average? Using last price for now.
                    })
                    .where(eq(products.id, item.productId));
            } else {
                // Update Variant Stock
                await db
                    .update(productVariants)
                    .set({
                        stock: sql`${productVariants.stock} + ${item.quantity}`,
                    })
                    .where(eq(productVariants.id, item.variantId));
            }

            // Create Inventory Log
            await db.insert(inventoryLogs).values({
                outletId: po.outletId,
                productId: item.productId,
                variantId: item.variantId,
                type: "in", // Goods In
                quantity: item.quantity,
                notes: `Received from PO #${po.invoiceNumber}`,
                createdBy: session.user.id,
            });
        }

        revalidatePath(`/dashboard/purchase-orders/${id}`);
        revalidatePath("/dashboard/purchase-orders");
        revalidatePath("/dashboard/inventory");
        return { success: true };
    } catch (error) {
        console.error("Failed to receive purchase order:", error);
        return { error: "Failed to receive purchase order" };
    }
}

export async function deletePurchaseOrder(id: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) return { error: "Unauthorized" };

        const hasPermission = await checkPermission("manage_purchase_orders");
        if (!hasPermission) return { error: "Forbidden: Insufficient permissions" };

        // Only allow deleting draft or cancelled?
        // Let user delete any, cascading delete items.

        await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
        revalidatePath("/dashboard/purchase-orders");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete purchase order:", error);
        return { error: "Failed to delete purchase order" };
    }
}
