"use server";

import { db, posSchema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const { categories } = posSchema;

export type Category = typeof categories.$inferSelect;

async function getSession() {
    return await auth.api.getSession({
        headers: await headers(),
    });
}

export async function getMasterCategories() {
    try {
        const session = await getSession();
        if (!session) return { data: [], error: "Unauthorized" };

        const result = await db
            .select()
            .from(categories)
            .where(eq(categories.ownerId, session.user.id))
            .orderBy(desc(categories.createdAt));

        return { data: result, error: null };
    } catch (error) {
        console.error("Error fetching master categories:", error);
        return { data: [], error: "Failed to fetch categories" };
    }
}

export async function createMasterCategory(name: string) {
    try {
        const session = await getSession();
        if (!session) return { data: null, error: "Unauthorized" };

        const result = await db
            .insert(categories)
            .values({
                ownerId: session.user.id,
                name,
            })
            .returning();

        revalidatePath("/dashboard/categories");
        revalidatePath("/dashboard/products");
        return { data: result[0], error: null };
    } catch (error) {
        console.error("Error creating category:", error);
        return { data: null, error: "Failed to create category" };
    }
}

export async function updateMasterCategory(id: string, name: string) {
    try {
        const session = await getSession();
        if (!session) return { data: null, error: "Unauthorized" };

        const result = await db
            .update(categories)
            .set({ name, updatedAt: new Date() })
            .where(and(eq(categories.id, id), eq(categories.ownerId, session.user.id)))
            .returning();

        revalidatePath("/dashboard/categories");
        revalidatePath("/dashboard/products");
        return { data: result[0], error: null };
    } catch (error) {
        console.error("Error updating category:", error);
        return { data: null, error: "Failed to update category" };
    }
}

export async function deleteMasterCategory(id: string) {
    try {
        const session = await getSession();
        if (!session) return { success: false, error: "Unauthorized" };

        // Check if there are products using this category? 
        // For now, let's just delete or set products.categoryId to null (handled by DB if cascade/nullify set, but we didn't specify onDelete)
        // Default in drizzle is no action. 

        await db
            .delete(categories)
            .where(and(eq(categories.id, id), eq(categories.ownerId, session.user.id)));

        revalidatePath("/dashboard/categories");
        revalidatePath("/dashboard/products");
        return { success: true, error: null };
    } catch (error) {
        console.error("Error deleting category:", error);
        return { success: false, error: "Failed to delete category" };
    }
}
