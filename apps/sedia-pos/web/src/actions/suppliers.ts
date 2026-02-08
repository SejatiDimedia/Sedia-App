"use server";

import { db } from "@/lib/db";
import { suppliers } from "@/lib/schema/sedia-pos";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkPermission } from "@/lib/auth-checks";

export async function getSuppliers(outletId: string) {
    console.log(`[getSuppliers] START for outletId: ${outletId}`);
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        console.log(`[getSuppliers] Session User: ${session?.user?.id}`);

        if (!session) return { error: "Unauthorized" };

        const hasPermission = await checkPermission("manage_suppliers");
        console.log(`[getSuppliers] Permission 'manage_suppliers': ${hasPermission}`);

        if (!hasPermission) return { error: "Forbidden: Insufficient permissions" };

        const data = await db.query.suppliers.findMany({
            where: and(
                eq(suppliers.outletId, outletId),
                eq(suppliers.isActive, true)
            ),
            orderBy: [desc(suppliers.createdAt)],
        });

        console.log(`[getSuppliers] User: ${session.user.id}, Perm: ${hasPermission}, Outlet: ${outletId}, Count: ${data.length}`);
        return { data };
    } catch (error) {
        console.error("Failed to fetch suppliers:", error);
        return { error: "Failed to fetch suppliers" };
    }
}

export async function createSupplier(data: {
    outletId: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
}) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) return { error: "Unauthorized" };

        const hasPermission = await checkPermission("manage_suppliers");
        if (!hasPermission) return { error: "Forbidden: Insufficient permissions" };

        await db.insert(suppliers).values({
            ...data,
            isActive: true,
        });

        revalidatePath("/dashboard/suppliers");
        return { success: true };
    } catch (error) {
        console.error("Failed to create supplier:", error);
        return { error: "Failed to create supplier" };
    }
}

export async function updateSupplier(
    id: string,
    data: {
        name: string;
        contactPerson?: string;
        email?: string;
        phone?: string;
        address?: string;
        notes?: string;
    }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) return { error: "Unauthorized" };

        const hasPermission = await checkPermission("manage_suppliers");
        if (!hasPermission) return { error: "Forbidden: Insufficient permissions" };

        await db
            .update(suppliers)
            .set(data)
            .where(eq(suppliers.id, id));

        revalidatePath("/dashboard/suppliers");
        return { success: true };
    } catch (error) {
        console.error("Failed to update supplier:", error);
        return { error: "Failed to update supplier" };
    }
}

export async function deleteSupplier(id: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) return { error: "Unauthorized" };

        const hasPermission = await checkPermission("manage_suppliers");
        if (!hasPermission) return { error: "Forbidden: Insufficient permissions" };

        // Soft delete
        await db
            .update(suppliers)
            .set({ isActive: false })
            .where(eq(suppliers.id, id));

        revalidatePath("/dashboard/suppliers");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete supplier:", error);
        return { error: "Failed to delete supplier" };
    }
}
