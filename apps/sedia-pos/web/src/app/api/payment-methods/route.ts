import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/payment-methods - List payment methods
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get("outletId");

        let methods;
        if (outletId) {
            // Get outlet-specific + global methods
            methods = await db
                .select()
                .from(posSchema.paymentMethods)
                .where(
                    eq(posSchema.paymentMethods.outletId, outletId)
                );
        } else {
            // Get all methods
            methods = await db.select().from(posSchema.paymentMethods);
        }

        return NextResponse.json(methods, {
            headers: { "Access-Control-Allow-Origin": "*" },
        });
    } catch (error) {
        console.error("Error fetching payment methods:", error);
        return NextResponse.json(
            { error: "Failed to fetch payment methods" },
            { status: 500 }
        );
    }
}

// POST /api/payment-methods - Create payment method
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { outletId, name, type } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Payment method name is required" },
                { status: 400 }
            );
        }

        const [newMethod] = await db
            .insert(posSchema.paymentMethods)
            .values({
                outletId: outletId || null,
                name,
                type: type || "cash",
            })
            .returning();

        return NextResponse.json(newMethod, { status: 201 });
    } catch (error) {
        console.error("Error creating payment method:", error);
        return NextResponse.json(
            { error: "Failed to create payment method" },
            { status: 500 }
        );
    }
}

// OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
