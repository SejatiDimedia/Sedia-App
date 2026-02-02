import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            console.log("[HeldOrders API] Unauthorized GET request (Session is null)");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get("outletId");

        if (!outletId) {
            return NextResponse.json({ error: "Outlet ID required" }, { status: 400 });
        }

        const heldOrders = await db
            .select()
            .from(posSchema.heldOrders)
            .where(
                and(
                    eq(posSchema.heldOrders.outletId, outletId),
                    eq(posSchema.heldOrders.status, "active")
                )
            )
            .orderBy(desc(posSchema.heldOrders.createdAt));

        return NextResponse.json(heldOrders);
    } catch (error) {
        console.error("Error fetching held orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch held orders" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            console.log("[HeldOrders API] Unauthorized POST request (Session is null)");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { outletId, customerId, customerName, customerPhone, items, notes, totalAmount } = body;

        if (!outletId || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const [heldOrder] = await db
            .insert(posSchema.heldOrders)
            .values({
                id: crypto.randomUUID(),
                outletId,
                cashierId: session.user.id,
                customerId,
                customerName,
                customerPhone,
                items: JSON.stringify(items),
                notes,
                totalAmount,
                status: "active",
            })
            .returning();

        return NextResponse.json(heldOrder, { status: 201 });
    } catch (error) {
        console.error("Error creating held order:", error);
        return NextResponse.json(
            { error: "Failed to create held order" },
            { status: 500 }
        );
    }
}
