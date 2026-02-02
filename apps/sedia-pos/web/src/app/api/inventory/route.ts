import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, sql, lt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/inventory - Get products with stock levels
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
        const lowStockOnly = searchParams.get("lowStock") === "true";
        const minStockThreshold = parseInt(searchParams.get("minStock") || "5");

        // Build conditions
        const conditions = [eq(posSchema.products.isActive, true)];

        if (outletId) {
            conditions.push(eq(posSchema.products.outletId, outletId));
        }

        if (lowStockOnly) {
            conditions.push(lt(posSchema.products.stock, minStockThreshold));
        }

        const products = await db
            .select({
                id: posSchema.products.id,
                name: posSchema.products.name,
                sku: posSchema.products.sku,
                stock: posSchema.products.stock,
                trackStock: posSchema.products.trackStock,
                price: posSchema.products.price,
                outletId: posSchema.products.outletId,
            })
            .from(posSchema.products)
            .where(and(...conditions))
            .orderBy(posSchema.products.stock);

        return NextResponse.json(products);
    } catch (error) {
        console.error("Error fetching inventory:", error);
        return NextResponse.json(
            { error: "Failed to fetch inventory" },
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

        const body = await request.json();
        const { productId, adjustment, type, notes } = body;

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
