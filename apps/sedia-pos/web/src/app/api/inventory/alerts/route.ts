import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, lt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/inventory/alerts - Get low stock products
export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get("outletId");
        const threshold = parseInt(searchParams.get("threshold") || "5");

        // Build conditions - get products with stock below threshold
        const conditions = [
            eq(posSchema.products.isActive, true),
            eq(posSchema.products.trackStock, true),
            lt(posSchema.products.stock, threshold),
        ];

        if (outletId) {
            conditions.push(eq(posSchema.products.outletId, outletId));
        }

        const lowStockProducts = await db
            .select({
                id: posSchema.products.id,
                name: posSchema.products.name,
                sku: posSchema.products.sku,
                stock: posSchema.products.stock,
                outletId: posSchema.products.outletId,
                outletName: posSchema.outlets.name,
            })
            .from(posSchema.products)
            .leftJoin(posSchema.outlets, eq(posSchema.products.outletId, posSchema.outlets.id))
            .where(and(...conditions))
            .orderBy(posSchema.products.stock);

        // Categorize alerts
        const criticalStock = lowStockProducts.filter((p) => p.stock === 0);
        const warningStock = lowStockProducts.filter((p) => p.stock > 0 && p.stock < threshold);

        return NextResponse.json({
            total: lowStockProducts.length,
            critical: criticalStock.length,
            warning: warningStock.length,
            products: lowStockProducts,
        });
    } catch (error) {
        console.error("Error fetching low stock alerts:", error);
        return NextResponse.json(
            { error: "Failed to fetch alerts" },
            { status: 500 }
        );
    }
}
