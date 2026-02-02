import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, or, ilike } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/customers - List customers
export async function GET(request: Request) {
    try {


        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get("outletId");
        const search = searchParams.get("search");

        // Build conditions
        const conditions = [];

        if (outletId) {
            conditions.push(eq(posSchema.customers.outletId, outletId));
        }

        if (search) {
            conditions.push(
                or(
                    ilike(posSchema.customers.name, `%${search}%`),
                    ilike(posSchema.customers.phone, `%${search}%`),
                    ilike(posSchema.customers.email, `%${search}%`)
                )
            );
        }

        const customers = await db
            .select()
            .from(posSchema.customers)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(posSchema.customers.name);

        return NextResponse.json(customers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        return NextResponse.json(
            { error: "Failed to fetch customers" },
            { status: 500 }
        );
    }
}

// POST /api/customers - Create new customer
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { outletId, name, phone, email } = body;

        if (!outletId || !name) {
            return NextResponse.json(
                { error: "outletId and name are required" },
                { status: 400 }
            );
        }

        // Find default tier for this outlet
        const [defaultTier] = await db
            .select()
            .from(posSchema.memberTiers)
            .where(
                and(
                    eq(posSchema.memberTiers.outletId, outletId),
                    eq(posSchema.memberTiers.isDefault, true)
                )
            );

        const [newCustomer] = await db
            .insert(posSchema.customers)
            .values({
                outletId,
                name,
                phone: phone || null,
                email: email || null,
                tierId: defaultTier?.id || null,
                points: 0,
                totalSpent: "0",
            })
            .returning();

        return NextResponse.json(newCustomer, { status: 201 });
    } catch (error) {
        console.error("Error creating customer:", error);
        return NextResponse.json(
            { error: "Failed to create customer" },
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
