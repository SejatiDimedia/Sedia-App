import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logActivity } from "@/lib/logging";

// GET /api/employees/[id] - Get single employee
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

        const [employee] = await db
            .select()
            .from(posSchema.employees)
            .where(eq(posSchema.employees.id, id));

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        return NextResponse.json(employee);
    } catch (error) {
        console.error("Error fetching employee:", error);
        return NextResponse.json(
            { error: "Failed to fetch employee" },
            { status: 500 }
        );
    }
}

// PUT /api/employees/[id] - Update employee
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
        const { name, role, pinCode, isActive } = body;

        const [updatedEmployee] = await db
            .update(posSchema.employees)
            .set({
                name,
                role: role || "cashier",
                pinCode: pinCode !== undefined ? pinCode : undefined,
                isActive: isActive !== undefined ? isActive : true,
            })
            .where(eq(posSchema.employees.id, id))
            .returning();

        if (!updatedEmployee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // Log clinical activity
        await logActivity({
            outletId: updatedEmployee.outletId,
            action: 'UPDATE',
            entityType: 'EMPLOYEE',
            entityId: updatedEmployee.id,
            description: `Mengubah data staf: ${updatedEmployee.name}`,
            metadata: { body }
        });

        return NextResponse.json({
            id: updatedEmployee.id,
            name: updatedEmployee.name,
            role: updatedEmployee.role,
        });
    } catch (error) {
        console.error("Error updating employee:", error);
        return NextResponse.json(
            { error: "Failed to update employee" },
            { status: 500 }
        );
    }
}

// DELETE /api/employees/[id] - Delete employee
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

        const [deletedEmployee] = await db
            .delete(posSchema.employees)
            .where(eq(posSchema.employees.id, id))
            .returning();

        if (!deletedEmployee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // Log clinical activity
        await logActivity({
            outletId: deletedEmployee.outletId,
            action: 'DELETE',
            entityType: 'EMPLOYEE',
            entityId: deletedEmployee.id,
            description: `Menghapus staf: ${deletedEmployee.name}`,
            metadata: { employee: deletedEmployee }
        });

        return NextResponse.json({ message: "Employee deleted successfully" });
    } catch (error) {
        console.error("Error deleting employee:", error);
        return NextResponse.json(
            { error: "Failed to delete employee" },
            { status: 500 }
        );
    }
}
