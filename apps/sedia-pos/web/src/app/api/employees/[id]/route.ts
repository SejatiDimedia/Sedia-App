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
        const { name, role, roleId, pinCode, isActive, outletIds, primaryOutletId } = body;

        // Support both old outletIds array and single primaryOutletId
        const finalOutletIds = outletIds as string[] | undefined;
        const finalPrimaryOutletId = primaryOutletId as string | undefined;

        const [updatedEmployee] = await db
            .update(posSchema.employees)
            .set({
                name,
                role: role || "cashier",
                roleId: roleId !== undefined ? roleId : undefined,
                pinCode: pinCode !== undefined ? pinCode : undefined,
                isActive: isActive !== undefined ? isActive : true,
                outletId: finalPrimaryOutletId || undefined, // Update legacy field if provided
                isDeleted: false,
                updatedAt: new Date(),
            })
            .where(eq(posSchema.employees.id, id))
            .returning();

        if (!updatedEmployee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // Sync junction table if outletIds provided
        if (finalOutletIds && finalOutletIds.length > 0) {
            // Verify permission for all outlets (Owner or Manager/Admin)
            for (const oid of finalOutletIds) {
                // 1. Check if user is owner
                const [ownedOutlet] = await db
                    .select()
                    .from(posSchema.outlets)
                    .where(
                        and(
                            eq(posSchema.outlets.id, oid),
                            eq(posSchema.outlets.ownerId, session.user.id)
                        )
                    );

                if (ownedOutlet) continue;

                // 2. Check if user is a manager or admin of this outlet
                const employeeData = await db.query.employees.findFirst({
                    where: and(
                        eq(posSchema.employees.userId, session.user.id),
                        eq(posSchema.employees.isActive, true),
                        eq(posSchema.employees.isDeleted, false)
                    ),
                    with: {
                        roleData: true,
                        employeeOutlets: {
                            where: eq(posSchema.employeeOutlets.outletId, oid)
                        }
                    }
                });

                if (employeeData) {
                    const userRole = (employeeData.roleData?.name || employeeData.role || "").toLowerCase();
                    const hasGlobalPermission = ["manager", "admin"].includes(userRole);

                    // If the employee is assigned to this outlet (either primary or junction)
                    const isAssignedToThisOutlet = employeeData.outletId === oid || employeeData.employeeOutlets.length > 0;

                    if (hasGlobalPermission && isAssignedToThisOutlet) continue;
                }

                return NextResponse.json({ error: `Akses ditolak atau outlet tidak ditemukan: ${oid}` }, { status: 403 });
            }

            // Delete old relations
            await db.delete(posSchema.employeeOutlets).where(eq(posSchema.employeeOutlets.employeeId, id));

            // Insert new relations
            for (const oid of finalOutletIds) {
                await db.insert(posSchema.employeeOutlets).values({
                    employeeId: id,
                    outletId: oid,
                    isPrimary: oid === finalPrimaryOutletId || (oid === finalOutletIds[0] && !finalPrimaryOutletId),
                });
            }
        }

        // Log clinical activity
        await logActivity({
            outletId: updatedEmployee.outletId || undefined,
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

        const [employee] = await db
            .select()
            .from(posSchema.employees)
            .where(eq(posSchema.employees.id, id));

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // Soft delete the employee
        const [deletedEmployee] = await db
            .update(posSchema.employees)
            .set({
                isDeleted: true,
                isActive: false,
                updatedAt: new Date()
            })
            .where(eq(posSchema.employees.id, id))
            .returning();

        // 3. Remove App Permission AND User Account to free up email
        // Logic from actions/employees.ts:deleteEmployee
        if (deletedEmployee.userId) {
            const { appPermission, user } = await import("@/lib/schema/auth-schema");

            // Delete permissions first
            await db.delete(appPermission).where(and(
                eq(appPermission.userId, deletedEmployee.userId),
                eq(appPermission.appId, "sedia-pos")
            ));

            // Delete the user account to free up the email
            await db.delete(user).where(eq(user.id, deletedEmployee.userId));
        }

        // Log activity
        await logActivity({
            outletId: deletedEmployee.outletId || undefined,
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
