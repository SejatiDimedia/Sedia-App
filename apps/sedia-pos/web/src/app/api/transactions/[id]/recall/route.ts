import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/transactions/[id]/recall - Retrieve held transaction details including items
export async function GET(
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

        // Get transaction
        const [transaction] = await db
            .select()
            .from(posSchema.transactions)
            .where(eq(posSchema.transactions.id, id));

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // Get items
        const items = await db
            .select()
            .from(posSchema.transactionItems)
            .where(eq(posSchema.transactionItems.transactionId, id));

        return NextResponse.json({
            transaction,
            items
        });
    } catch (error) {
        console.error("Error recalling transaction:", error);
        return NextResponse.json(
            { error: "Failed to recall transaction" },
            { status: 500 }
        );
    }
}

// DELETE /api/transactions/[id]/recall - Cancel/Delete held transaction
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

        // Build cascading delete not set up for items? Manually delete items first
        await db
            .delete(posSchema.transactionItems)
            .where(eq(posSchema.transactionItems.transactionId, id));

        const [deleted] = await db
            .delete(posSchema.transactions)
            .where(eq(posSchema.transactions.id, id))
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Held transaction deleted" });
    } catch (error) {
        console.error("Error deleting held transaction:", error);
        return NextResponse.json(
            { error: "Failed to delete held transaction" },
            { status: 500 }
        );
    }
}
