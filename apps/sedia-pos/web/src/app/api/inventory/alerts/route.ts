import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, lt, inArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOutlets } from "@/actions/outlets";

// GET /api/inventory/alerts - Get low stock products
export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const outlets = await getOutlets();
        const allowedOutletIds = outlets.map(o => o.id);

        if (allowedOutletIds.length === 0) {
            return NextResponse.json({ error: "Forbidden: No outlets assigned" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const requestedOutletId = searchParams.get("outletId");
        const threshold = parseInt(searchParams.get("threshold") || "5");

        // Build conditions for base products - get products with stock below threshold
        const conditions = [
            eq(posSchema.products.isActive, true),
            eq(posSchema.products.trackStock, true),
            lt(posSchema.products.stock, threshold),
        ];

        if (requestedOutletId) {
            // Verify access
            if (!allowedOutletIds.includes(requestedOutletId)) {
                return NextResponse.json({ error: "Forbidden: Access to this outlet denied" }, { status: 403 });
            }
            conditions.push(eq(posSchema.products.outletId, requestedOutletId));
        } else {
            // No specific outlet requested, limit to allowed outlets
            conditions.push(inArray(posSchema.products.outletId, allowedOutletIds));
        }

        // 1. Get products without variants that are low stock
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
            .leftJoin(posSchema.productVariants, eq(posSchema.products.id, posSchema.productVariants.productId))
            .where(and(
                ...conditions,
                sql`${posSchema.productVariants.id} IS NULL` // Only base products without variants
            ))
            .orderBy(posSchema.products.stock);

        // 2. Get variants that are low stock
        const variantConditions = [
            eq(posSchema.productVariants.isActive, true),
            eq(posSchema.products.trackStock, true),
            lt(posSchema.productVariants.stock, threshold),
        ];

        if (requestedOutletId) {
            variantConditions.push(eq(posSchema.products.outletId, requestedOutletId));
        } else {
            variantConditions.push(inArray(posSchema.products.outletId, allowedOutletIds));
        }

        const lowStockVariants = await db
            .select({
                id: posSchema.productVariants.id,
                productId: posSchema.productVariants.productId,
                name: posSchema.products.name,
                variantName: posSchema.productVariants.name,
                sku: posSchema.products.sku, // or variant specific sku?
                stock: posSchema.productVariants.stock,
                outletId: posSchema.products.outletId,
                outletName: posSchema.outlets.name,
            })
            .from(posSchema.productVariants)
            .innerJoin(posSchema.products, eq(posSchema.productVariants.productId, posSchema.products.id))
            .leftJoin(posSchema.outlets, eq(posSchema.products.outletId, posSchema.outlets.id))
            .where(and(...variantConditions))
            .orderBy(posSchema.productVariants.stock);

        // Combine
        const combinedAlerts = [
            ...lowStockProducts.map(p => ({ ...p, isVariant: false })),
            ...lowStockVariants.map(v => ({
                id: v.id,
                name: `${v.name} (${v.variantName})`,
                sku: v.sku,
                stock: v.stock,
                outletId: v.outletId,
                outletName: v.outletName,
                isVariant: true
            }))
        ].sort((a, b) => (a.stock || 0) - (b.stock || 0));

        // Categorize alerts
        const criticalStock = combinedAlerts.filter((p) => (p.stock || 0) === 0);
        const warningStock = combinedAlerts.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) < threshold);

        return NextResponse.json({
            total: combinedAlerts.length,
            critical: criticalStock.length,
            warning: warningStock.length,
            products: combinedAlerts,
        });
    } catch (error) {
        console.error("Error fetching low stock alerts:", error);
        return NextResponse.json(
            { error: "Failed to fetch alerts" },
            { status: 500 }
        );
    }
}
