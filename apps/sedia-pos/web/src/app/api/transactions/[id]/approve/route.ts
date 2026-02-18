import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logActivity } from "@/lib/logging";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Fetch transaction and its items
        const transaction = await db.query.transactions.findFirst({
            where: eq(posSchema.transactions.id, id),
            with: {
                items: true
            }
        });

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        if (transaction.status !== "pending" || transaction.paymentMethod !== "whatsapp") {
            return NextResponse.json(
                { error: "Only pending WhatsApp orders can be approved" },
                { status: 400 }
            );
        }

        // 2. Perform updates: Transaction Status and Stock Reduction
        // We'll do this in a simple sequence (Drizzle transaction would be better but keeping it robust with current libs)

        // A. Update Transaction Status
        await db
            .update(posSchema.transactions)
            .set({
                status: "completed",
                paymentStatus: "paid", // Assume paid once approved/recieved
            })
            .where(eq(posSchema.transactions.id, id));

        // B. Reduce Stock for each item
        for (const item of transaction.items) {
            if (item.productId) {
                if (item.variantId) {
                    const [variant] = await db
                        .select()
                        .from(posSchema.productVariants)
                        .where(eq(posSchema.productVariants.id, item.variantId));

                    if (variant) {
                        const newStock = Math.max(0, (variant.stock || 0) - item.quantity);
                        await db
                            .update(posSchema.productVariants)
                            .set({ stock: newStock })
                            .where(eq(posSchema.productVariants.id, item.variantId));

                        // Log inventory
                        await db.insert(posSchema.inventoryLogs).values({
                            outletId: transaction.outletId,
                            productId: item.productId,
                            variantId: item.variantId,
                            type: 'out',
                            quantity: -item.quantity,
                            notes: `WhatsApp Order Approval: ${transaction.invoiceNumber}`,
                            createdBy: session.user.id
                        });
                    }
                } else {
                    const [product] = await db
                        .select()
                        .from(posSchema.products)
                        .where(eq(posSchema.products.id, item.productId));

                    if (product && product.trackStock) {
                        const newStock = Math.max(0, product.stock - item.quantity);
                        await db
                            .update(posSchema.products)
                            .set({ stock: newStock })
                            .where(eq(posSchema.products.id, item.productId));

                        // Log inventory
                        await db.insert(posSchema.inventoryLogs).values({
                            outletId: transaction.outletId,
                            productId: item.productId,
                            type: 'out',
                            quantity: -item.quantity,
                            notes: `WhatsApp Order Approval: ${transaction.invoiceNumber}`,
                            createdBy: session.user.id
                        });
                    }
                }
            }
        }

        // 3. Log activity
        await logActivity({
            outletId: transaction.outletId,
            action: 'UPDATE',
            entityType: 'TRANSACTION',
            entityId: transaction.id,
            description: `Menyetujui pesanan WhatsApp: ${transaction.invoiceNumber}`,
            metadata: {
                previousStatus: transaction.status,
                newStatus: 'completed'
            }
        });

        return NextResponse.json({ message: "Order approved and stock updated" });
    } catch (error) {
        console.error("Error approving transaction:", error);
        return NextResponse.json(
            { error: "Failed to approve transaction" },
            { status: 500 }
        );
    }
}
