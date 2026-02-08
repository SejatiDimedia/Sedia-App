"use server";

import { db, posSchema } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const { products, categories, outlets, productVariants } = posSchema;

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;

// Get all products for an outlet
export async function getProducts(outletId: string) {
    try {
        const result = await db.query.products.findMany({
            where: and(
                eq(posSchema.products.outletId, outletId),
                eq(posSchema.products.isDeleted, false)
            ),
            with: {
                variants: {
                    where: eq(posSchema.productVariants.isActive, true)
                }
            },
            orderBy: desc(posSchema.products.createdAt)
        });
        return { data: result, error: null };
    } catch (error) {
        console.error("Error fetching products:", error);
        return { data: [], error: "Failed to fetch products" };
    }
}

// Get single product with variants
export async function getProductById(id: string) {
    try {
        const result = await db.query.products.findFirst({
            where: and(eq(products.id, id), eq(products.isDeleted, false)),
            with: {
                variants: true,
            },
        });
        return { data: result || null, error: null };
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
    variants?: {
        name: string;
        type: string;
        priceAdjustment: string;
        stock: number;
        isActive: boolean;
    }[];
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
        variants: {
            id?: string;
            name: string;
            type: string;
            priceAdjustment: string;
            stock: number;
            isActive: boolean;
        }[];
    }>
) {
    try {
        const result = await db
            .update(products)
            .set({
                categoryId: data.categoryId,
                name: data.name,
                sku: data.sku,
                barcode: data.barcode,
                price: data.price,
                costPrice: data.costPrice,
                stock: data.stock,
                trackStock: data.trackStock,
                imageUrl: data.imageUrl,
                isActive: data.isActive,
                updatedAt: new Date(),
            })
            .where(eq(products.id, id))
            .returning();

        const product = result[0];

        // Handle variants sync
        if (data.variants) {
            // 1. Get existing variants
            const existingVariants = await db
                .select()
                .from(productVariants)
                .where(eq(productVariants.productId, id));

            const variantIdsToKeep = data.variants
                .map((v) => v.id)
                .filter(Boolean) as string[];

            // 2. Delete variants not in the new list
            const { notInArray } = await import("drizzle-orm");
            if (variantIdsToKeep.length > 0) {
                await db
                    .delete(productVariants)
                    .where(
                        and(
                            eq(productVariants.productId, id),
                            notInArray(productVariants.id, variantIdsToKeep)
                        )
                    );
            } else {
                await db
                    .delete(productVariants)
                    .where(eq(productVariants.productId, id));
            }

            // 3. Update existing or insert new variants
            for (const v of data.variants) {
                if (v.id) {
                    await db
                        .update(productVariants)
                        .set({
                            name: v.name,
                            type: v.type,
                            priceAdjustment: v.priceAdjustment,
                            stock: v.stock,
                            isActive: v.isActive,
                        })
                        .where(eq(productVariants.id, v.id));
                } else {
                    await db.insert(productVariants).values({
                        productId: id,
                        name: v.name,
                        type: v.type,
                        priceAdjustment: v.priceAdjustment,
                        stock: v.stock,
                        isActive: v.isActive,
                    });
                }
            }
        }

        revalidatePath("/dashboard/products");
        return { data: product, error: null };
    } catch (error) {
        console.error("Error updating product:", error);
        return { data: null, error: "Failed to update product" };
    }
}

// Delete product
export async function deleteProduct(id: string) {
    try {
        await db.update(products)
            .set({ isDeleted: true, updatedAt: new Date() })
            .where(eq(products.id, id));
        revalidatePath("/dashboard/products");
        return { success: true, error: null };
    } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, error: "Failed to delete product" };
    }
}

// Get master categories for the current user or based on outlet context
export async function getCategories(outletId?: string) {
    try {
        const { auth } = await import("@/lib/auth");
        const { headers } = await import("next/headers");
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) return { data: [], error: "Unauthorized" };

        let targetOwnerId = session.user.id;

        // If outletId is provided, we use the owner of that outlet.
        // This allows employees/managers to see categories owned by the business owner.
        if (outletId) {
            const outlet = await db.query.outlets.findFirst({
                where: eq(outlets.id, outletId),
                columns: { ownerId: true }
            });
            if (outlet) {
                targetOwnerId = outlet.ownerId;
            }
        }

        const result = await db
            .select()
            .from(categories)
            .where(eq(categories.ownerId, targetOwnerId))
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
        const { auth } = await import("@/lib/auth");
        const { headers } = await import("next/headers");
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) return { data: null, error: "Unauthorized" };

        const result = await db
            .insert(categories)
            .values({
                ownerId: session.user.id,
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
// Generate sample products
export async function generateProducts(outletId: string) {
    const sampleProducts = [
        { name: "Kopi Susu Gula Aren", price: "22000", category: "Coffee", imageUrl: "https://images.unsplash.com/photo-1541167760496-162955ed8a9f?w=400&h=400&fit=crop" },
        { name: "Americano", price: "18000", category: "Coffee", imageUrl: "https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=400&h=400&fit=crop" },
        { name: "Caffe Latte", price: "25000", category: "Coffee", imageUrl: "https://images.unsplash.com/photo-1570968015861-d38a6bad74aa?w=400&h=400&fit=crop" },
        { name: "Croissant Original", price: "15000", category: "Bakery", imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop" },
        { name: "Pain au Chocolat", price: "18000", category: "Bakery", imageUrl: "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=400&h=400&fit=crop" },
        { name: "Earl Grey Tea", price: "15000", category: "Tea", imageUrl: "https://images.unsplash.com/photo-1594631252845-29fc458695d1?w=400&h=400&fit=crop" },
        { name: "Matcha Latte", price: "28000", category: "Tea", imageUrl: "https://images.unsplash.com/photo-1515823149216-5bc732d88f6c?w=400&h=400&fit=crop" },
        { name: "Indomie Goreng Special", price: "12000", category: "Food", imageUrl: "https://images.unsplash.com/photo-1612927623704-620246fd17f3?w=400&h=400&fit=crop" },
        { name: "Nasi Goreng Ayam", price: "25000", category: "Food", imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=400&fit=crop" },
        { name: "Mineral Water", price: "5000", category: "Drinks", imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop" },
    ];

    try {
        // 1. Get or Create Categories
        const categoryNames = [...new Set(sampleProducts.map(p => p.category))];
        const categoryMap = new Map();

        // 0. Get Session for ownerId
        const { auth } = await import("@/lib/auth");
        const { headers } = await import("next/headers");
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) return { success: false, error: "Unauthorized" };

        for (const name of categoryNames) {
            let cat = await db.query.categories.findFirst({
                where: and(eq(categories.ownerId, session.user.id), eq(categories.name, name))
            });

            if (!cat) {
                const [newCat] = await db.insert(categories).values({
                    ownerId: session.user.id,
                    outletId,
                    name
                }).returning();
                cat = newCat;
            }
            categoryMap.set(name, cat.id);
        }

        // 2. Insert Products
        const productsToInsert = sampleProducts.map(p => ({
            outletId,
            categoryId: categoryMap.get(p.category),
            name: p.name,
            price: p.price,
            costPrice: (parseInt(p.price) * 0.4).toString(),
            stock: 50,
            trackStock: true,
            isActive: true,
            imageUrl: p.imageUrl,
        }));

        await db.insert(products).values(productsToInsert);

        revalidatePath("/dashboard/products");
        return { success: true, error: null };
    } catch (error) {
        console.error("Error generating products:", error);
        return { success: false, error: "Failed to generate products" };
    }
}
// Import products from Excel/CSV
export async function importProducts(outletId: string, base64Data: string) {
    try {
        const { auth } = await import("@/lib/auth");
        const { headers } = await import("next/headers");
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) return { success: false, error: "Unauthorized" };

        const XLSX = await import("xlsx");
        const buffer = Buffer.from(base64Data, "base64");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (data.length === 0) return { success: false, error: "File is empty" };

        // 1. Get unique categories from file
        const categoryNames = [...new Set(data.map(row => row.Kategori || row.category).filter(Boolean))];
        const categoryMap = new Map();

        // 2. Resolve/Create Categories
        for (const name of categoryNames) {
            let cat = await db.query.categories.findFirst({
                where: and(eq(categories.ownerId, session.user.id), eq(categories.name, name))
            });

            if (!cat) {
                const [newCat] = await db.insert(categories).values({
                    ownerId: session.user.id,
                    outletId,
                    name
                }).returning();
                cat = newCat;
            }
            categoryMap.set(name, cat.id);
        }

        // 3. Prepare Products
        const productsToInsert = data.map(row => {
            const name = row.Nama || row.name;
            if (!name) return null;

            return {
                outletId,
                categoryId: categoryMap.get(row.Kategori || row.category) || null,
                name: String(name),
                sku: row.SKU || row.sku || null,
                barcode: row.Barcode || row.barcode || null,
                price: String(row["Harga Jual"] || row.price || "0"),
                costPrice: String(row["Harga Modal"] || row.costPrice || "0"),
                stock: parseInt(row.Stok || row.stock || "0"),
                trackStock: true,
                isActive: true,
            };
        }).filter(Boolean);

        if (productsToInsert.length === 0) return { success: false, error: "No valid products found in file" };

        // 4. Batch Insert (using chunks to avoid large query errors)
        const chunkSize = 100;
        for (let i = 0; i < productsToInsert.length; i += chunkSize) {
            const chunk = productsToInsert.slice(i, i + chunkSize);
            await db.insert(products).values(chunk as any);
        }

        revalidatePath("/dashboard/products");
        return { success: true, count: productsToInsert.length, error: null };
    } catch (error: any) {
        console.error("Error importing products:", error);
        return { success: false, error: error.message || "Failed to import products" };
    }
}

// Bulk delete products
export async function bulkDeleteProducts(ids: string[]) {
    try {
        const { inArray } = await import("drizzle-orm");
        await db.update(products)
            .set({ isDeleted: true, updatedAt: new Date() })
            .where(inArray(products.id, ids));
        revalidatePath("/dashboard/products");
        return { success: true, error: null };
    } catch (error) {
        console.error("Error bulk deleting products:", error);
        return { success: false, error: "Failed to delete products" };
    }
}

// Bulk update product status
export async function bulkUpdateProductStatus(ids: string[], isActive: boolean) {
    try {
        const { inArray } = await import("drizzle-orm");
        await db
            .update(products)
            .set({ isActive, updatedAt: new Date() })
            .where(inArray(products.id, ids));
        revalidatePath("/dashboard/products");
        return { success: true, error: null };
    } catch (error) {
        console.error("Error bulk updating status:", error);
        return { success: false, error: "Failed to update product status" };
    }
}
