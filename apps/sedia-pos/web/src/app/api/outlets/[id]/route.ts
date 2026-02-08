import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function isAuthorized(userId: string, outletId: string) {
    // 1. Check if owner
    const [outletOwner] = await db
        .select()
        .from(posSchema.outlets)
        .where(
            and(
                eq(posSchema.outlets.id, outletId),
                eq(posSchema.outlets.ownerId, userId)
            )
        );

    if (outletOwner) return true;

    // 2. Check if employee with manager/admin role for THIS outlet
    const employee = await db.query.employees.findFirst({
        where: and(
            eq(posSchema.employees.userId, userId),
            eq(posSchema.employees.isDeleted, false)
        ),
        with: {
            employeeOutlets: {
                where: eq(posSchema.employeeOutlets.outletId, outletId)
            }
        }
    });

    if (employee) {
        // Check legacy single outlet assignment
        if (employee.outletId === outletId) return true;
        // Check multi-outlet assignment
        const hasAccess = employee.employeeOutlets.some(eo => eo.outletId === outletId);
        if (hasAccess) return true;
    }

    return false;
}

// GET /api/outlets/[id] - Get single outlet
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

        const authorized = await isAuthorized(session.user.id, id);
        if (!authorized) {
            return NextResponse.json({ error: "Outlet not found or access denied" }, { status: 404 });
        }

        const [outlet] = await db
            .select()
            .from(posSchema.outlets)
            .where(eq(posSchema.outlets.id, id));

        return NextResponse.json(outlet);
    } catch (error) {
        console.error("Error fetching outlet:", error);
        return NextResponse.json(
            { error: "Failed to fetch outlet" },
            { status: 500 }
        );
    }
}

// PUT /api/outlets/[id] - Update outlet
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

        const authorized = await isAuthorized(session.user.id, id);
        if (!authorized) {
            return NextResponse.json({ error: "Outlet not found or access denied" }, { status: 404 });
        }

        const body = await request.json();
        const { name, address, phone, primaryColor, secondaryColor } = body;

        const [updatedOutlet] = await db
            .update(posSchema.outlets)
            .set({
                name,
                address: address || null,
                phone: phone || null,
                primaryColor: primaryColor || undefined,
                secondaryColor: secondaryColor || undefined,
            })
            .where(eq(posSchema.outlets.id, id))
            .returning();

        return NextResponse.json(updatedOutlet);
    } catch (error) {
        console.error("Error updating outlet:", error);
        return NextResponse.json(
            { error: "Failed to update outlet" },
            { status: 500 }
        );
    }
}

// DELETE /api/outlets/[id] - Delete outlet
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

        const authorized = await isAuthorized(session.user.id, id);
        if (!authorized) {
            return NextResponse.json({ error: "Outlet not found or access denied" }, { status: 404 });
        }

        await db
            .delete(posSchema.outlets)
            .where(eq(posSchema.outlets.id, id));

        return NextResponse.json({ message: "Outlet deleted successfully" });
    } catch (error) {
        console.error("Error deleting outlet:", error);
        return NextResponse.json(
            { error: "Failed to delete outlet" },
            { status: 500 }
        );
    }
}
