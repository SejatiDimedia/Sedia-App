import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logActivity } from "@/lib/logging";

export async function DELETE(
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

        // 1. Fetch transaction
        const transaction = await db.query.transactions.findFirst({
            where: eq(posSchema.transactions.id, id),
        });

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // 2. Security/Policy: Only allow deleting WhatsApp orders that are cancelled or pending
        // Or if the user really wants to allow any deletion, we could, but let's stick to the prompt's context.
        const isWaOrder = transaction.paymentMethod === "whatsapp";
        const isDeletableStatus = ["pending", "cancelled"].includes(transaction.status);

        if (!isWaOrder || !isDeletableStatus) {
            return NextResponse.json(
                { error: "Hanya pesanan WhatsApp yang tertunda atau dibatalkan yang dapat dihapus" },
                { status: 400 }
            );
        }

        // 3. Delete Transaction Items first (Drizzle should handle Cascade if set, but let's be safe if not)
        await db.delete(posSchema.transactionItems).where(eq(posSchema.transactionItems.transactionId, id));
        await db.delete(posSchema.transactionPayments).where(eq(posSchema.transactionPayments.transactionId, id));

        // 4. Delete Transaction
        await db.delete(posSchema.transactions).where(eq(posSchema.transactions.id, id));

        // 5. Log activity
        await logActivity({
            outletId: transaction.outletId,
            action: 'DELETE',
            entityType: 'TRANSACTION',
            entityId: id,
            description: `Menghapus data pesanan WhatsApp: ${transaction.invoiceNumber}`,
            metadata: {
                invoiceNumber: transaction.invoiceNumber,
                totalAmount: transaction.totalAmount
            }
        });

        return NextResponse.json({ message: "Transaction deleted successfully" });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return NextResponse.json(
            { error: "Failed to delete transaction" },
            { status: 500 }
        );
    }
}
