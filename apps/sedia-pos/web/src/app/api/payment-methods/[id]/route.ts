import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// PUT /api/payment-methods/[id] - Update payment method
export async function PUT(
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

        const body = await request.json();
        const { name, type, isActive } = body;

        const [updated] = await db
            .update(posSchema.paymentMethods)
            .set({ name, type, isActive })
            .where(eq(posSchema.paymentMethods.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating payment method:", error);
        return NextResponse.json(
            { error: "Failed to update payment method" },
            { status: 500 }
        );
    }
}

// DELETE /api/payment-methods/[id] - Delete payment method
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

        const [deleted] = await db
            .delete(posSchema.paymentMethods)
            .where(eq(posSchema.paymentMethods.id, id))
            .returning();

        if (!deleted) {
            return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Payment method deleted" });
    } catch (error) {
        console.error("Error deleting payment method:", error);
        return NextResponse.json(
            { error: "Failed to delete payment method" },
            { status: 500 }
        );
    }
}
