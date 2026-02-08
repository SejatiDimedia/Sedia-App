"use server";

import { db } from "@/lib/db"; // Ensure this path is correct
import { roles, employees, outlets } from "@/lib/schema/sedia-pos";
import { eq, and, or, isNull, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type RoleInput = {
    outletId?: string; // Optional if you want outlet-specific roles
    name: string;
    description?: string;
    permissions: string[]; // We will store as JSON string
};

export async function getRoles(outletId?: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) return [];

        // 1. Get all accessible outlet IDs (owned + assigned)
        const ownedOutlets = await db
            .select({ id: outlets.id })
            .from(outlets)
            .where(eq(outlets.ownerId, session.user.id));

        const employee = await db.query.employees.findFirst({
            where: and(
                eq(employees.userId, session.user.id),
                eq(employees.isDeleted, false)
            ),
            with: {
                employeeOutlets: true
            }
        });

        const accessibleOutletIds = new Set<string>(ownedOutlets.map(o => o.id));
        if (employee) {
            if (employee.outletId) accessibleOutletIds.add(employee.outletId);
            employee.employeeOutlets?.forEach(eo => {
                if (eo.outletId) accessibleOutletIds.add(eo.outletId);
            });
        }

        const outletIds = Array.from(accessibleOutletIds);
        const isOwner = ownedOutlets.length > 0;

        // 2. Fetch roles with a more permissive approach for owners
        // If a specific outletId was requested, we MUST ensure the user has access to it
        // unless they are just viewing system roles.
        if (outletId && !outletIds.includes(outletId) && !isOwner) {
            // If they are not an owner and requesting an outlet they don't have access to,
            // only show system roles for safety.
            return await db.query.roles.findMany({
                where: eq(roles.isSystem, true)
            });
        }

        return await db.query.roles.findMany({
            where: outletId
                ? or(
                    eq(roles.isSystem, true),
                    eq(roles.outletId, outletId),
                    isNull(roles.outletId) // Include Global Roles
                )
                : or(
                    eq(roles.isSystem, true),
                    // Owners see "global" custom roles (outletId IS NULL)
                    // Managers only see system roles or roles linked to their assigned outlets
                    isOwner ? isNull(roles.outletId) : undefined,
                    outletIds.length > 0 ? inArray(roles.outletId, outletIds) : undefined
                )
        });
    } catch (error) {
        console.error("Failed to fetch roles:", error);
        return [];
    }
}

export async function createRole(data: RoleInput) {
    try {
        // Basic validation
        if (!data.name) return { success: false, error: "Nama role harus diisi" };

        await db.insert(roles).values({
            outletId: data.outletId,
            name: data.name,
            description: data.description,
            permissions: JSON.stringify(data.permissions), // Store as string
            isSystem: false,
        });

        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard", "layout");
        return { success: true };
    } catch (error) {
        console.error("Failed to create role:", error);
        return { success: false, error: "Gagal membuat role" };
    }
}

export async function updateRole(id: string, data: Partial<RoleInput>) {
    try {
        const updateData: any = {
            updatedAt: new Date(),
        };
        if (data.name) updateData.name = data.name;
        if (data.description) updateData.description = data.description;
        if (data.permissions) updateData.permissions = JSON.stringify(data.permissions);

        await db.update(roles).set(updateData).where(eq(roles.id, id));
        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard", "layout");
        return { success: true };
    } catch (error) {
        console.error("Failed to update role:", error);
        return { success: false, error: "Gagal mengupdate role" };
    }
}

export async function deleteRole(id: string) {
    try {
        // 1. Check if role is system
        const role = await db.query.roles.findFirst({
            where: eq(roles.id, id)
        });

        if (!role) return { success: false, error: "Role tidak ditemukan" };
        if (role.isSystem) return { success: false, error: "Role sistem tidak dapat dihapus" };

        // 2. Check if used by any employee
        const usedBy = await db.query.employees.findFirst({
            where: eq(employees.roleId, id)
        });

        if (usedBy) return { success: false, error: "Role sedang digunakan oleh karyawan. Hapus atau ubah role karyawan terlebih dahulu." };

        await db.delete(roles).where(eq(roles.id, id));
        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard", "layout");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete role:", error);
        return { success: false, error: "Gagal menghapus role" };
    }
}
