import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/schema/sedia-pos";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get("outletId");

        if (!outletId) {
            return NextResponse.json({ error: "Outlet ID is required" }, { status: 400 });
        }

        const data = await db.query.suppliers.findMany({
            where: and(
                eq(suppliers.outletId, outletId),
                eq(suppliers.isActive, true)
            ),
            orderBy: [desc(suppliers.createdAt)],
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return NextResponse.json(
            { error: "Failed to fetch suppliers" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { outletId, name, contactPerson, email, phone, address, notes } = body;

        if (!outletId || !name) {
            return NextResponse.json(
                { error: "Missing required fields: outletId, name" },
                { status: 400 }
            );
        }

        const [newSupplier] = await db.insert(suppliers).values({
            outletId,
            name,
            contactPerson,
            email,
            phone,
            address,
            notes,
            isActive: true,
        }).returning();

        return NextResponse.json(newSupplier, { status: 201 });
    } catch (error) {
        console.error("Error creating supplier:", error);
        return NextResponse.json(
            { error: "Failed to create supplier" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const { name, contactPerson, email, phone, address, notes } = body;

        await db
            .update(suppliers)
            .set({
                name,
                contactPerson,
                email,
                phone,
                address,
                notes,
            })
            .where(eq(suppliers.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating supplier:", error);
        return NextResponse.json(
            { error: "Failed to update supplier" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
        }

        // Soft delete
        await db
            .update(suppliers)
            .set({ isActive: false })
            .where(eq(suppliers.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting supplier:", error);
        return NextResponse.json(
            { error: "Failed to delete supplier" },
            { status: 500 }
        );
    }
}
