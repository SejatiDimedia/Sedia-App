"use server";

import { db } from "@/lib/db"; // Ensure this path is correct
import { roles, employees } from "@/lib/schema/sedia-pos";
import { eq, and, or, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type RoleInput = {
    outletId?: string; // Optional if you want outlet-specific roles
    name: string;
    description?: string;
    permissions: string[]; // We will store as JSON string
};

export async function getRoles(outletId?: string) {
    try {
        // Fetch system roles (outletId is null) AND roles for this outlet
        // If outletId is not provided, fetch all roles where outletId is null (System + Global Custom)
        const whereClause = outletId
            ? or(eq(roles.isSystem, true), eq(roles.outletId, outletId))
            : isNull(roles.outletId);

        return await db.select().from(roles).where(whereClause);
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
        return { success: true };
    } catch (error) {
        console.error("Failed to delete role:", error);
        return { success: false, error: "Gagal menghapus role" };
    }
}
