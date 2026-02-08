"use server";

import { db } from "@/lib/db";
import { employees, employeeOutlets } from "@/lib/schema/sedia-pos";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export type EmployeeInput = {
    outletId?: string; // DEPRECATED: Single outlet (backward compat)
    outletIds?: string[]; // NEW: Multiple outlets
    primaryOutletId?: string; // Which outlet is primary
    name: string;
    role: "manager" | "cashier"; // Fallback/Deprecated
    roleId?: string; // New Dynamic Role
    pinCode?: string | null;
    // Fields for User creation
    email?: string;
    password?: string;
    isActive?: boolean;
};

export async function getEmployees(outletId: string) {
    if (!outletId) return [];

    // Get employees assigned to this outlet via junction table
    const outletEmployees = await db.query.employeeOutlets.findMany({
        where: eq(employeeOutlets.outletId, outletId),
        with: {
            employee: {
                with: {
                    roleData: true,
                    employeeOutlets: {
                        with: {
                            outlet: true
                        }
                    }
                }
            }
        }
    });

    // Also get legacy employees with direct outletId (backward compat)
    // Include where isDeleted is false OR NULL (for old records without the column)
    const legacyEmployees = await db.query.employees.findMany({
        where: eq(employees.outletId, outletId),
        with: {
            roleData: true,
            employeeOutlets: {
                with: {
                    outlet: true
                }
            }
        }
    });

    // Combine and deduplicate
    const employeeMap = new Map();

    // First add legacy employees (direct outletId)
    legacyEmployees.forEach(emp => {
        // Filter out soft-deleted employees
        if (emp.isDeleted !== true) {
            employeeMap.set(emp.id, emp);
        }
    });

    // Then add/override from junction table
    outletEmployees.forEach(eo => {
        if (eo.employee && eo.employee.isDeleted !== true) {
            employeeMap.set(eo.employee.id, eo.employee);
        }
    });

    return Array.from(employeeMap.values());
}

export async function createEmployee(data: EmployeeInput) {
    try {
        let userId: string | null = null;
        let finalName = data.name;

        // Determine outlets to assign
        const outletIds = data.outletIds || (data.outletId ? [data.outletId] : []);
        const primaryOutletId = data.primaryOutletId || outletIds[0];

        if (outletIds.length === 0) {
            return { success: false, error: "At least one outlet is required" };
        }

        // 1. Create User Account if email/password provided
        if (data.email && data.password) {
            try {
                const newUser = await auth.api.signUpEmail({
                    body: {
                        email: data.email,
                        password: data.password,
                        name: data.name,
                    },
                    asResponse: false
                });

                if (newUser?.user?.id) {
                    userId = newUser.user.id;
                    finalName = newUser.user.name;

                    const { appPermission } = await import("@/lib/schema/auth-schema");
                    await db.insert(appPermission).values({
                        userId: userId,
                        appId: "sedia-pos",
                        role: "user",
                        uploadEnabled: true,
                        storageLimit: 524288000,
                    });
                }
            } catch (err: any) {
                console.error("Auth creation failed:", err);
                if (err?.body?.message) {
                    return { success: false, error: err.body.message };
                }
                return { success: false, error: "Gagal membuat akun login. Email mungkin sudah digunakan." };
            }
        }

        // 2. Create Employee Record (use first outlet as legacy outletId)
        const [newEmployee] = await db.insert(employees).values({
            outletId: primaryOutletId, // Legacy field for backward compat
            userId: userId,
            name: finalName,
            role: data.roleId ? "custom" : data.role,
            roleId: data.roleId,
            pinCode: data.pinCode,
            isActive: true,
            isDeleted: false,
        }).returning();

        // 3. Create Employee-Outlet assignments in junction table
        for (const outletId of outletIds) {
            await db.insert(employeeOutlets).values({
                employeeId: newEmployee.id,
                outletId: outletId,
                isPrimary: outletId === primaryOutletId,
            });
        }

        revalidatePath("/dashboard/employees");
        return { success: true, employeeId: newEmployee.id };
    } catch (error) {
        console.error("Failed to create employee:", error);
        return { success: false, error: "Failed to create employee" };
    }
}

export async function updateEmployee(id: string, data: Partial<EmployeeInput>) {
    try {
        // 1. Get current employee to find userId
        const currentEmployee = await db.query.employees.findFirst({
            where: eq(employees.id, id),
            with: {
                employeeOutlets: true
            }
        });

        if (!currentEmployee) {
            return { success: false, error: "Employee not found" };
        }

        // 2. Prepare update data for employees table
        const employeeUpdateData: any = {
            updatedAt: new Date(),
        };
        if (data.name) employeeUpdateData.name = data.name;

        console.log("updateEmployee - Incoming Data:", JSON.stringify(data, null, 2));

        // If a Dynamic Role (roleId) is provided, we set roleId and mark generic "custom" role
        // This prevents legacy string "cashier" from triggering fallback behavior
        if (data.roleId) {
            console.log("updateEmployee - Setting Custom Role:", data.roleId);
            employeeUpdateData.roleId = data.roleId;
            employeeUpdateData.role = "custom";
        } else if (data.role) {
            console.log("updateEmployee - Setting Legacy Role:", data.role);
            // If explicit legacy role string is sent (and no roleId)
            employeeUpdateData.role = data.role;
            employeeUpdateData.roleId = null; // Clear roleId so it doesn't conflict
        }

        console.log("updateEmployee - Final Payload:", JSON.stringify(employeeUpdateData, null, 2));

        if (data.pinCode !== undefined) employeeUpdateData.pinCode = data.pinCode;
        if (data.isActive !== undefined) employeeUpdateData.isActive = data.isActive;

        // Update primary outlet if changed
        if (data.primaryOutletId) {
            employeeUpdateData.outletId = data.primaryOutletId;
        }

        await db.update(employees)
            .set(employeeUpdateData)
            .where(eq(employees.id, id));

        // 3. Handle Outlet Assignments via junction table
        if (data.outletIds !== undefined) {
            const newOutletIds = data.outletIds;
            const primaryOutletId = data.primaryOutletId || newOutletIds[0];

            // Delete all existing outlet assignments
            await db.delete(employeeOutlets)
                .where(eq(employeeOutlets.employeeId, id));

            // Insert new outlet assignments
            for (const outletId of newOutletIds) {
                await db.insert(employeeOutlets).values({
                    employeeId: id,
                    outletId: outletId,
                    isPrimary: outletId === primaryOutletId,
                });
            }
        }

        // 4. Update User/Account if userId exists
        if (currentEmployee.userId) {
            // Update Email
            if (data.email) {
                const { user } = await import("@/lib/schema/auth-schema");
                try {
                    await db.update(user)
                        .set({ email: data.email, updatedAt: new Date() })
                        .where(eq(user.id, currentEmployee.userId));
                } catch (e: any) {
                    console.error("Failed to update email:", e);
                    if (e.code === '23505') {
                        return { success: false, error: "Email sudah digunakan user lain." };
                    }
                }
            }

            // Password update (logging only for now)
            if (data.password) {
                console.warn("Password update requested - logic pending verification of auth API");
            }
        }

        revalidatePath("/dashboard/employees");
        return { success: true };
    } catch (error) {
        console.error("Failed to update employee:", error);
        return { success: false, error: "Failed to update employee" };
    }
}



export async function deleteEmployee(id: string) {
    try {
        // 1. Find employee to get userId
        const employee = await db.query.employees.findFirst({
            where: eq(employees.id, id),
        });

        if (!employee) return { success: false, error: "Employee not found" };

        // 2. Delete Employee (or just deactivate?)
        // User asked "deleted ... still login". 
        // If we delete employee, we should probably ban the user or delete the user too.
        // Or at least remove appPermission.

        await db.delete(employees).where(eq(employees.id, id));

        // 3. Remove App Permission AND User Account to free up email
        if (employee.userId) {
            const { appPermission, user } = await import("@/lib/schema/auth-schema");

            // Delete permissions first (FK usually cascades but let's be explicit or safe)
            await db.delete(appPermission).where(and(
                eq(appPermission.userId, employee.userId),
                eq(appPermission.appId, "sedia-pos")
            ));

            // Delete the user account to free up the email
            await db.delete(user).where(eq(user.id, employee.userId));
        }

        revalidatePath("/dashboard/employees");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete employee:", error);
        return { success: false, error: "Failed to delete employee" };
    }
}
