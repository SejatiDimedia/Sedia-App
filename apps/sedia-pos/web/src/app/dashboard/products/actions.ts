"use server";

import { db, posSchema } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const { products, categories, outlets } = posSchema;

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;

// Get all products for an outlet
export async function getProducts(outletId: string) {
    try {
        const result = await db
            .select()
            .from(products)
            .where(eq(products.outletId, outletId))
            .orderBy(desc(products.createdAt));
        return { data: result, error: null };
    } catch (error) {
        console.error("Error fetching products:", error);
        return { data: [], error: "Failed to fetch products" };
    }
}

// Get single product
export async function getProductById(id: string) {
    try {
        const result = await db
            .select()
            .from(products)
            .where(eq(products.id, id))
            .limit(1);
        return { data: result[0] || null, error: null };
    } catch (error) {
        console.error("Error fetching product:", error);
        return { data: null, error: "Failed to fetch product" };
    }
}

// Create product
export async function createProduct(data: {
    outletId: string;
    categoryId?: string;
    name: string;
    sku?: string;
    barcode?: string;
    price: string;
    costPrice?: string;
    stock?: number;
    trackStock?: boolean;
    imageUrl?: string;
}) {
    try {
        const result = await db
            .insert(products)
            .values({
                outletId: data.outletId,
                categoryId: data.categoryId || null,
                name: data.name,
                sku: data.sku || null,
                barcode: data.barcode || null,
                price: data.price,
                costPrice: data.costPrice || "0",
                stock: data.stock || 0,
                trackStock: data.trackStock ?? true,
                imageUrl: data.imageUrl || null,
                isActive: true,
            })
            .returning();

        revalidatePath("/dashboard/products");
        return { data: result[0], error: null };
    } catch (error) {
        console.error("Error creating product:", error);
        return { data: null, error: "Failed to create product" };
    }
}

// Update product
export async function updateProduct(
    id: string,
    data: Partial<{
        categoryId: string | null;
        name: string;
        sku: string | null;
        barcode: string | null;
        price: string;
        costPrice: string;
        stock: number;
        trackStock: boolean;
        imageUrl: string | null;
        isActive: boolean;
    }>
) {
    try {
        const result = await db
            .update(products)
            .set(data)
            .where(eq(products.id, id))
            .returning();

        revalidatePath("/dashboard/products");
        return { data: result[0], error: null };
    } catch (error) {
        console.error("Error updating product:", error);
        return { data: null, error: "Failed to update product" };
    }
}

// Delete product
export async function deleteProduct(id: string) {
    try {
        await db.delete(products).where(eq(products.id, id));
        revalidatePath("/dashboard/products");
        return { success: true, error: null };
    } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, error: "Failed to delete product" };
    }
}

// Get categories for an outlet
export async function getCategories(outletId: string) {
    try {
        const result = await db
            .select()
            .from(categories)
            .where(eq(categories.outletId, outletId))
            .orderBy(categories.name);
        return { data: result, error: null };
    } catch (error) {
        console.error("Error fetching categories:", error);
        return { data: [], error: "Failed to fetch categories" };
    }
}

// Create category
export async function createCategory(data: { outletId: string; name: string }) {
    try {
        const result = await db
            .insert(categories)
            .values({
                outletId: data.outletId,
                name: data.name,
            })
            .returning();

        revalidatePath("/dashboard/products");
        return { data: result[0], error: null };
    } catch (error) {
        console.error("Error creating category:", error);
        return { data: null, error: "Failed to create category" };
    }
}
