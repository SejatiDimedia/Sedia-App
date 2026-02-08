"use server";

import { db } from "@/lib/db";
import { user, account, appPermission } from "@/lib/schema/auth-schema";
import { employees, roles, outlets, employeeOutlets } from "@/lib/schema/sedia-pos";
import { eq, and, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
}

// Types
export type UserWithPermission = {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    role: string;
    permissionId: string | null;
    employeeRoleId?: string | null;
    outletId?: string | null;
    employeeId?: string | null;
};

export type Role = {
    id: string;
    name: string;
    description: string | null;
};

export type Outlet = {
    id: string;
    name: string;
};

/**
 * Get all available roles
 */
export async function getRoles(): Promise<{ data?: Role[]; error?: string }> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return { error: "Unauthorized" };

        const allRoles = await db.select({
            id: roles.id,
            name: roles.name,
            description: roles.description,
        }).from(roles);

        return { data: allRoles };
    } catch (error) {
        console.error("getRoles error:", error);
        return { error: "Failed to fetch roles" };
    }
}

/**
 * Get all available outlets
 */
export async function getOutlets(): Promise<{ data?: Outlet[]; error?: string }> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return { error: "Unauthorized" };

        const allOutlets = await db.select({
            id: outlets.id,
            name: outlets.name,
        }).from(outlets);

        return { data: allOutlets };
    } catch (error) {
        console.error("getOutlets error:", error);
        return { error: "Failed to fetch outlets" };
    }
}

/**
 * Get all users with their sedia-pos app permissions
 * Requires admin role
 */
export async function getUsers(): Promise<{ data?: UserWithPermission[]; error?: string }> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { error: "Unauthorized" };
        }

        // Check if current user is admin
        const currentUserPerm = await db.query.appPermission.findFirst({
            where: and(
                eq(appPermission.userId, session.user.id),
                eq(appPermission.appId, "sedia-pos")
            )
        });

        if (currentUserPerm?.role !== "admin") {
            return { error: "Forbidden: Admin access required" };
        }

        // Get all users
        const users = await db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                image: user.image,
                createdAt: user.createdAt,
            })
            .from(user)
            .orderBy(desc(user.createdAt));

        // Get permissions and employee details for each user
        const usersWithPermissions: UserWithPermission[] = await Promise.all(
            users.map(async (u) => {
                const perm = await db.query.appPermission.findFirst({
                    where: and(
                        eq(appPermission.userId, u.id),
                        eq(appPermission.appId, "sedia-pos")
                    )
                });

                // Fetch employee details if they exist
                const emp = await db.query.employees.findFirst({
                    where: eq(employees.userId, u.id),
                    with: {
                        employeeOutlets: {
                            where: eq(employeeOutlets.isPrimary, true),
                            limit: 1
                        }
                    }
                });

                // Get primary outlet ID
                let outletId = null;
                if (emp?.employeeOutlets && emp.employeeOutlets.length > 0) {
                    outletId = emp.employeeOutlets[0].outletId;
                } else if (emp?.outletId) {
                    // Fallback to deprecated field
                    outletId = emp.outletId;
                }

                return {
                    ...u,
                    role: perm?.role || "user",
                    permissionId: perm?.id || null,
                    employeeId: emp?.id || null,
                    employeeRoleId: emp?.roleId || null,
                    outletId: outletId
                };
            })
        );

        return { data: usersWithPermissions };
    } catch (error) {
        console.error("getUsers error:", error);
        return { error: "Failed to fetch users" };
    }
}

/**
 * Create a new user
 * Requires admin role
 */
export async function createUser(data: {
    email: string;
    password: string;
    name: string;
    role: "admin" | "user";
    employeeRoleId?: string;
    outletId?: string;
}): Promise<{ success?: boolean; error?: string; userId?: string }> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { error: "Unauthorized" };
        }

        // Check if current user is admin
        const currentUserPerm = await db.query.appPermission.findFirst({
            where: and(
                eq(appPermission.userId, session.user.id),
                eq(appPermission.appId, "sedia-pos")
            )
        });

        if (currentUserPerm?.role !== "admin") {
            return { error: "Forbidden: Admin access required" };
        }

        // Check if email already exists
        const existingUser = await db.query.user.findFirst({
            where: eq(user.email, data.email)
        });

        if (existingUser) {
            return { error: "Email already registered" };
        }

        // Create user using better-auth's signUpEmail API (proper password hashing)
        const newUserResult = await auth.api.signUpEmail({
            body: {
                email: data.email,
                password: data.password,
                name: data.name,
            },
            asResponse: false
        });

        if (!newUserResult?.user?.id) {
            return { error: "Failed to create user" };
        }

        const userId = newUserResult.user.id;

        // Create app permission
        await db.insert(appPermission).values({
            userId: userId,
            appId: "sedia-pos",
            role: data.role,
            uploadEnabled: true,
        });

        // If role is 'user' and employee details are provided, create employee record
        if (data.role === "user" && data.employeeRoleId && data.outletId) {
            // Create employee
            const [newEmployee] = await db.insert(employees).values({
                userId: userId,
                name: data.name,
                roleId: data.employeeRoleId,
                // We use explicit join table, but might fill deprecated field for backward compatibility if needed
                outletId: data.outletId,
                isActive: true,
            }).returning();

            if (newEmployee) {
                // Link to outlet
                await db.insert(employeeOutlets).values({
                    employeeId: newEmployee.id,
                    outletId: data.outletId,
                    isPrimary: true,
                });
            }
        }

        return { success: true, userId };

    } catch (error) {
        console.error("createUser error:", error);
        return { error: "Failed to create user" };
    }
}

/**
 * Update a user's role
 * Requires admin role
 */
export async function updateUserRole(
    userId: string,
    role: "admin" | "user"
): Promise<{ success?: boolean; error?: string }> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { error: "Unauthorized" };
        }

        // Check if current user is admin
        const currentUserPerm = await db.query.appPermission.findFirst({
            where: and(
                eq(appPermission.userId, session.user.id),
                eq(appPermission.appId, "sedia-pos")
            )
        });

        if (currentUserPerm?.role !== "admin") {
            return { error: "Forbidden: Admin access required" };
        }

        // Prevent self-demotion
        if (userId === session.user.id && role !== "admin") {
            return { error: "Cannot demote yourself" };
        }

        // Find existing permission
        const existingPerm = await db.query.appPermission.findFirst({
            where: and(
                eq(appPermission.userId, userId),
                eq(appPermission.appId, "sedia-pos")
            )
        });

        if (existingPerm) {
            await db.update(appPermission)
                .set({ role, updatedAt: new Date() })
                .where(eq(appPermission.id, existingPerm.id));
        } else {
            await db.insert(appPermission).values({
                userId,
                appId: "sedia-pos",
                role,
                uploadEnabled: true,
            });
        }

        const { revalidatePath } = await import("next/cache");
        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        console.error("updateUserRole error:", error);
        return { error: "Failed to update user role" };
    }
}

/**
 * Update a user's details
 * Requires admin role
 */
export async function updateUser(
    userId: string,
    data: { name?: string; password?: string; employeeRoleId?: string; outletId?: string }
): Promise<{ success?: boolean; error?: string }> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { error: "Unauthorized" };
        }

        // Check if current user is admin
        const currentUserPerm = await db.query.appPermission.findFirst({
            where: and(
                eq(appPermission.userId, session.user.id),
                eq(appPermission.appId, "sedia-pos")
            )
        });

        if (currentUserPerm?.role !== "admin") {
            return { error: "Forbidden: Admin access required" };
        }

        // Update user name if provided
        if (data.name) {
            await db.update(user)
                .set({ name: data.name, updatedAt: new Date() })
                .where(eq(user.id, userId));
        }

        // Update password if provided
        if (data.password) {
            try {
                // Debug logs
                console.log("[updateUser] Current User:", session.user.id, session.user.email);
                console.log("[updateUser] Current Role:", (session.user as any).role);

                // Check if user has a credential account
                const credentialAccount = await db.query.account.findFirst({
                    where: and(
                        eq(account.userId, userId),
                        eq(account.providerId, "credential")
                    )
                });

                if (!credentialAccount) {
                    console.log("[updateUser] No credential account found. Creating one...");
                    // Create new credential account manually
                    const hashedPassword = await hashPassword(data.password);
                    await db.insert(account).values({
                        id: crypto.randomUUID(),
                        userId: userId,
                        accountId: userId, // For credential provider, accountId is usually userId or email
                        providerId: "credential",
                        password: hashedPassword,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    console.log("[updateUser] Credential account created successfully.");
                } else {
                    console.log("[updateUser] Credential account exists. Updating via API...");
                    // Use better-auth's admin API to set password for another user
                    // This ensures correct hashing format
                    await auth.api.setUserPassword({
                        body: {
                            userId: userId,
                            newPassword: data.password,
                        },
                        headers: await headers(),
                    });
                }
            } catch (err) {
                console.error("updateUser password error:", err);
                return { error: "Failed to update password" };
            }
        }

        // Update employee details if provided
        if (data.employeeRoleId || data.outletId) {
            // Find existing employee record
            const existingEmployee = await db.query.employees.findFirst({
                where: eq(employees.userId, userId)
            });

            if (existingEmployee) {
                // Update existing
                await db.update(employees)
                    .set({
                        roleId: data.employeeRoleId || existingEmployee.roleId,
                        outletId: data.outletId || existingEmployee.outletId, // Keep deprecated field in sync
                        updatedAt: new Date()
                    })
                    .where(eq(employees.id, existingEmployee.id));

                if (data.outletId) {
                    // Update primary outlet logic
                    // First, check if connection exists
                    const existingConnection = await db.query.employeeOutlets.findFirst({
                        where: and(
                            eq(employeeOutlets.employeeId, existingEmployee.id),
                            eq(employeeOutlets.outletId, data.outletId)
                        )
                    });

                    if (existingConnection) {
                        // Ensure it returns as primary, others not
                        await db.update(employeeOutlets)
                            .set({ isPrimary: false })
                            .where(eq(employeeOutlets.employeeId, existingEmployee.id));

                        await db.update(employeeOutlets)
                            .set({ isPrimary: true })
                            .where(eq(employeeOutlets.id, existingConnection.id));
                    } else {
                        // New connection
                        // Set others to non-primary
                        await db.update(employeeOutlets)
                            .set({ isPrimary: false })
                            .where(eq(employeeOutlets.employeeId, existingEmployee.id));

                        await db.insert(employeeOutlets).values({
                            employeeId: existingEmployee.id,
                            outletId: data.outletId,
                            isPrimary: true
                        });
                    }
                }

            } else {
                // Create new employee linked to this user
                // Need name, usually from user record if not provided in `data`
                // But `data.name` might be undefined here if we are only updating role
                let empName = data.name;
                if (!empName) {
                    const userRecord = await db.query.user.findFirst({
                        where: eq(user.id, userId),
                        columns: { name: true }
                    });
                    empName = userRecord?.name || "Employee";
                }

                if (data.employeeRoleId && data.outletId) {
                    const [newEmployee] = await db.insert(employees).values({
                        userId: userId,
                        name: empName,
                        roleId: data.employeeRoleId,
                        outletId: data.outletId,
                        isActive: true,
                    }).returning();

                    if (newEmployee) {
                        await db.insert(employeeOutlets).values({
                            employeeId: newEmployee.id,
                            outletId: data.outletId,
                            isPrimary: true,
                        });
                    }
                }
            }
        }

        const { revalidatePath } = await import("next/cache");
        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        console.error("updateUser error:", error);
        return { error: "Failed to update user" };
    }
}

/**
 * Delete a user
 * Requires admin role. Cannot delete self.
 */
export async function deleteUser(userId: string): Promise<{ success?: boolean; error?: string }> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { error: "Unauthorized" };
        }

        // Check if current user is admin
        const currentUserPerm = await db.query.appPermission.findFirst({
            where: and(
                eq(appPermission.userId, session.user.id),
                eq(appPermission.appId, "sedia-pos")
            )
        });

        if (currentUserPerm?.role !== "admin") {
            return { error: "Forbidden: Admin access required" };
        }

        // Prevent self-deletion
        if (userId === session.user.id) {
            return { error: "Cannot delete yourself" };
        }

        // Delete in order: appPermission -> account -> user (cascades)
        await db.delete(appPermission)
            .where(eq(appPermission.userId, userId));

        // User deletion will cascade to sessions and accounts
        await db.delete(user)
            .where(eq(user.id, userId));

        return { success: true };
    } catch (error) {
        console.error("deleteUser error:", error);
        return { error: "Failed to delete user" };
    }
}
