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

        // 1. Fetch transaction
        const transaction = await db.query.transactions.findFirst({
            where: eq(posSchema.transactions.id, id),
        });

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        if (transaction.status !== "pending" || transaction.paymentMethod !== "whatsapp") {
            return NextResponse.json(
                { error: "Only pending WhatsApp orders can be rejected" },
                { status: 400 }
            );
        }

        // 2. Update Transaction Status to 'cancelled'
        await db
            .update(posSchema.transactions)
            .set({
                status: "cancelled",
                paymentStatus: "cancelled",
            })
            .where(eq(posSchema.transactions.id, id));

        // 3. Log activity
        await logActivity({
            outletId: transaction.outletId,
            action: 'UPDATE',
            entityType: 'TRANSACTION',
            entityId: transaction.id,
            description: `Menolak pesanan WhatsApp: ${transaction.invoiceNumber}`,
            metadata: {
                previousStatus: transaction.status,
                newStatus: 'cancelled'
            }
        });

        return NextResponse.json({ message: "Order rejected successfully" });
    } catch (error) {
        console.error("Error rejecting transaction:", error);
        return NextResponse.json(
            { error: "Failed to reject transaction" },
            { status: 500 }
        );
    }
}
