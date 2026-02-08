"use server";

import { db, posSchema } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const { products, productVariants } = posSchema;

export async function getProducts(outletId: string) {
    try {
        const result = await db.query.products.findMany({
            where: and(
                eq(products.outletId, outletId),
                eq(products.isDeleted, false)
            ),
            with: {
                variants: {
                    where: eq(productVariants.isActive, true)
                }
            },
            orderBy: desc(products.createdAt)
        });
        return { data: result, error: null };
    } catch (error) {
        console.error("Error fetching products:", error);
        return { data: [], error: "Failed to fetch products" };
    }
}
