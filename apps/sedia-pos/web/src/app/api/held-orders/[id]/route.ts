import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface HeldOrderItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const heldOrder = await db
            .select()
            .from(posSchema.heldOrders)
            .where(eq(posSchema.heldOrders.id, id))
            .limit(1);

        if (heldOrder.length === 0) {
            return NextResponse.json({ error: "Held order not found" }, { status: 404 });
        }

        const order = heldOrder[0];
        return NextResponse.json({
            ...order,
            items: JSON.parse(order.items as string) as HeldOrderItem[],
        });
    } catch (error) {
        console.error("Error fetching held order:", error);
        return NextResponse.json(
            { error: "Failed to fetch held order" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, notes } = body;

        const [heldOrder] = await db
            .update(posSchema.heldOrders)
            .set({
                ...(status !== undefined && { status }),
                ...(notes !== undefined && { notes }),
            })
            .where(eq(posSchema.heldOrders.id, id))
            .returning();

        return NextResponse.json(heldOrder);
    } catch (error) {
        console.error("Error updating held order:", error);
        return NextResponse.json(
            { error: "Failed to update held order" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await db
            .delete(posSchema.heldOrders)
            .where(eq(posSchema.heldOrders.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting held order:", error);
        return NextResponse.json(
            { error: "Failed to delete held order" },
            { status: 500 }
        );
    }
}
