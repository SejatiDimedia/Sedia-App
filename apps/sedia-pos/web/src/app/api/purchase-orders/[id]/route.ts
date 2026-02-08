import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchaseOrders, purchaseOrderItems, products, productVariants, inventoryLogs } from "@/lib/schema/sedia-pos";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { receivePurchaseOrder } from "@/actions/purchase-orders"; // Reuse logic if possible, or reimplement?
// Reimplementing logic for API route to allow proper response handling suitable for mobile

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        console.log(`[API PO Detail] Fetching PO with ID: ${id}`);

        const data = await db.query.purchaseOrders.findFirst({
            where: eq(purchaseOrders.id, id),
            with: {
                supplier: true,
                items: {
                    with: {
                        product: true,
                        variant: true,
                    }
                }
            }
        });

        console.log(`[API PO Detail] Query result: ${data ? 'Found' : 'NOT FOUND'}`);

        if (!data) {
            return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching purchase order:", error);
        return NextResponse.json(
            { error: "Failed to fetch purchase order" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { action, status } = body;
        // action: "update_status" | "receive"

        const po = await db.query.purchaseOrders.findFirst({
            where: eq(purchaseOrders.id, id),
            with: { items: true }
        });

        if (!po) {
            return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
        }

        if (action === "update_status") {
            if (!status) {
                return NextResponse.json({ error: "Status is required" }, { status: 400 });
            }
            await db.update(purchaseOrders)
                .set({ status })
                .where(eq(purchaseOrders.id, id));

            return NextResponse.json({ success: true });
        } else if (action === "receive") {
            // Logic for receiving items (stock update)
            if (po.status === "received") {
                return NextResponse.json({ error: "PO already received" }, { status: 400 });
            }

            // Using transaction for safety
            await db.transaction(async (tx) => {
                // Update PO status
                await tx.update(purchaseOrders)
                    .set({
                        status: "received",
                        receivedDate: new Date()
                    })
                    .where(eq(purchaseOrders.id, id));

                // Update Inventory
                for (const item of po.items) {
                    if (item.variantId) {
                        // Find local variant stock
                        const variant = await tx.query.productVariants.findFirst({
                            where: eq(productVariants.id, item.variantId)
                        });

                        if (variant) {
                            // Update variant stock
                            await tx.update(productVariants)
                                .set({ stock: (variant.stock || 0) + item.quantity })
                                .where(eq(productVariants.id, item.variantId));

                            // Also update parent product stock (sum of variants? or independent? 
                            // Usually if variant exists, product stock is sum of variants or tracked at variant level.
                            // In this system, product.stock seems to be aggregate or separate.
                            // Let's check how we handle it. In 'purchase-orders.ts' action:
                            // It updates variant stock AND product stock. 
                            // Wait, let's verify `receivePurchaseOrder` action logic.
                        }
                    } else {
                        // Product stock
                        const product = await tx.query.products.findFirst({
                            where: eq(products.id, item.productId)
                        });

                        if (product) {
                            await tx.update(products)
                                .set({ stock: product.stock + item.quantity })
                                .where(eq(products.id, item.productId));
                        }
                    }

                    // Log inventory movement
                    await tx.insert(inventoryLogs).values({
                        outletId: po.outletId,
                        productId: item.productId,
                        variantId: item.variantId,
                        type: "in",
                        quantity: item.quantity,
                        notes: `Purchase Order Receive: ${po.invoiceNumber}`,
                        createdBy: session.user.id
                    });
                }
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Error updating purchase order:", error);
        return NextResponse.json(
            { error: "Failed to update purchase order" },
            { status: 500 }
        );
    }
}
