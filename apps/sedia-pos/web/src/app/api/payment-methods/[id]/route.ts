import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function isAuthorized(userId: string, outletId: string | null) {
    if (!outletId) return true; // Global methods (if any)

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
        // Only allow manager/admin roles to manage payment methods
        if (employee.role === 'manager' || employee.role === 'admin') {
            const hasAccess = employee.employeeOutlets.some(eo => eo.outletId === outletId);
            if (hasAccess) return true;
        }
    }

    return false;
}

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

        // Check if user is authorized for this payment method's outlet
        const [method] = await db
            .select()
            .from(posSchema.paymentMethods)
            .where(eq(posSchema.paymentMethods.id, id));

        if (!method) {
            return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
        }

        const authorized = await isAuthorized(session.user.id, method.outletId);
        if (!authorized) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const body = await request.json();
        const {
            name,
            type,
            isActive,
            bankName,
            accountNumber,
            accountHolder,
            qrisData,
            qrisImageUrl,
            bankAccounts,
            isManual
        } = body;

        const [updated] = await db
            .update(posSchema.paymentMethods)
            .set({
                name,
                type,
                isActive,
                bankName,
                accountNumber,
                accountHolder,
                qrisData,
                qrisImageUrl,
                bankAccounts,
                isManual
            })
            .where(eq(posSchema.paymentMethods.id, id))
            .returning();

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

        // Check if user is authorized for this payment method's outlet
        const [method] = await db
            .select()
            .from(posSchema.paymentMethods)
            .where(eq(posSchema.paymentMethods.id, id));

        if (!method) {
            return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
        }

        const authorized = await isAuthorized(session.user.id, method.outletId);
        if (!authorized) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const [deleted] = await db
            .delete(posSchema.paymentMethods)
            .where(eq(posSchema.paymentMethods.id, id))
            .returning();

        return NextResponse.json({ message: "Payment method deleted" });
    } catch (error) {
        console.error("Error deleting payment method:", error);
        return NextResponse.json(
            { error: "Failed to delete payment method" },
            { status: 500 }
        );
    }
}
