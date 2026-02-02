import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/customers/[id] - Get single customer
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

        const [customer] = await db
            .select()
            .from(posSchema.customers)
            .where(eq(posSchema.customers.id, id));

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error fetching customer:", error);
        return NextResponse.json(
            { error: "Failed to fetch customer" },
            { status: 500 }
        );
    }
}

// PUT /api/customers/[id] - Update customer
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
        const { name, phone, email } = body;

        const [updatedCustomer] = await db
            .update(posSchema.customers)
            .set({
                name,
                phone: phone || null,
                email: email || null,
            })
            .where(eq(posSchema.customers.id, id))
            .returning();

        if (!updatedCustomer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        return NextResponse.json(updatedCustomer);
    } catch (error) {
        console.error("Error updating customer:", error);
        return NextResponse.json(
            { error: "Failed to update customer" },
            { status: 500 }
        );
    }
}

// DELETE /api/customers/[id] - Delete customer
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

        const [deletedCustomer] = await db
            .delete(posSchema.customers)
            .where(eq(posSchema.customers.id, id))
            .returning();

        if (!deletedCustomer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Customer deleted successfully" });
    } catch (error) {
        console.error("Error deleting customer:", error);
        return NextResponse.json(
            { error: "Failed to delete customer" },
            { status: 500 }
        );
    }
}
