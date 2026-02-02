import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/logging";

// GET /api/products - Fetch all products
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get("outletId");

        let query;
        if (outletId) {
            query = db
                .select()
                .from(posSchema.products)
                .where(eq(posSchema.products.outletId, outletId));
        } else {
            query = db.select().from(posSchema.products);
        }

        const products = await query;

        return NextResponse.json(products, {
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

// POST /api/products - Create new product
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const { outletId, name, price, sku, stock, imageUrl, categoryId, isActive } = body;

        if (!outletId || !name || price === undefined) {
            return NextResponse.json(
                { error: "Missing required fields: outletId, name, price" },
                { status: 400 }
            );
        }

        const [newProduct] = await db.insert(posSchema.products).values({
            outletId,
            name,
            price: String(price),
            sku: sku || null,
            stock: stock || 0,
            imageUrl: imageUrl || null,
            categoryId: categoryId || null,
            isActive: isActive !== undefined ? isActive : true,
        }).returning();

        // Log clinical activity
        await logActivity({
            outletId,
            action: 'CREATE',
            entityType: 'PRODUCT',
            entityId: newProduct.id,
            description: `Menambahkan produk baru: ${newProduct.name}`,
            metadata: { product: newProduct }
        });

        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
