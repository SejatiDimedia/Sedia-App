import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, sql, lt, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOutlets } from "@/actions/outlets";

// GET /api/inventory - Get products with stock levels
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
        const lowStockOnly = searchParams.get("lowStock") === "true";
        const minStockThreshold = parseInt(searchParams.get("minStock") || "5");

        // Build conditions
        const conditions = [eq(posSchema.products.isActive, true)];

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

        if (lowStockOnly) {
            conditions.push(lt(posSchema.products.stock, minStockThreshold));
        }

        try {
            const products = await db.query.products.findMany({
                where: and(...conditions),
                with: {
                    variants: {
                        where: eq(posSchema.productVariants.isActive, true)
                    }
                },
                orderBy: (p, { asc }) => [asc(p.stock)],
            });

            return NextResponse.json(products);
        } catch (queryErr) {
            console.error("[Inventory API] Query failed:", queryErr);
            throw queryErr;
        }
    } catch (error) {
        console.error("[Inventory API] Failed to fetch inventory:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to fetch inventory", detail: message },
            { status: 500 }
        );
    }
}

// PATCH /api/inventory - Adjust stock for a product
export async function PATCH(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check outlet permission
        const outlets = await getOutlets();
        const allowedOutletIds = outlets.map(o => o.id);

        if (allowedOutletIds.length === 0) {
            return NextResponse.json({ error: "Forbidden: No outlets assigned" }, { status: 403 });
        }

        const body = await request.json();
        const { productId, variantId, adjustment, type, notes } = body;

        if (!productId || adjustment === undefined) {
            return NextResponse.json(
                { error: "productId and adjustment are required" },
                { status: 400 }
            );
        }

        // Get current product
        const [product] = await db
            .select()
            .from(posSchema.products)
            .where(eq(posSchema.products.id, productId));

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Verify write access to this outlet
        if (!allowedOutletIds.includes(product.outletId)) {
            return NextResponse.json({ error: "Forbidden: No permission to modify this outlet's inventory" }, { status: 403 });
        }

        if (variantId) {
            // Get current variant
            const [variant] = await db
                .select()
                .from(posSchema.productVariants)
                .where(eq(posSchema.productVariants.id, variantId));

            if (!variant) {
                return NextResponse.json({ error: "Variant not found" }, { status: 404 });
            }

            const newStock = (variant.stock || 0) + adjustment;

            // Update variant stock
            await db
                .update(posSchema.productVariants)
                .set({ stock: newStock })
                .where(eq(posSchema.productVariants.id, variantId));

            // Log the adjustment
            await db.insert(posSchema.inventoryLogs).values({
                outletId: product.outletId,
                productId: productId,
                variantId: variantId,
                type: type || "adjustment",
                quantity: adjustment,
                notes: notes || `Stock adjusted by ${adjustment > 0 ? "+" : ""}${adjustment} (Variant: ${variant.name})`,
                createdBy: session.user.id,
            });

            return NextResponse.json({
                success: true,
                productId,
                variantId,
                previousStock: variant.stock,
                newStock,
            });
        }

        const newStock = product.stock + adjustment;

        // Update product stock
        await db
            .update(posSchema.products)
            .set({ stock: newStock })
            .where(eq(posSchema.products.id, productId));

        // Log the adjustment
        await db.insert(posSchema.inventoryLogs).values({
            outletId: product.outletId,
            productId: productId,
            type: type || "adjustment",
            quantity: adjustment,
            notes: notes || `Stock adjusted by ${adjustment > 0 ? "+" : ""}${adjustment}`,
            createdBy: session.user.id,
        });

        return NextResponse.json({
            success: true,
            productId,
            previousStock: product.stock,
            newStock,
        });
    } catch (error: any) {
        console.error("Error adjusting stock:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to adjust stock" },
            { status: 500 }
        );
    }
}

// OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
