import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/products/[id]/variants - List variants for a product
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const variants = await db
            .select()
            .from(posSchema.productVariants)
            .where(eq(posSchema.productVariants.productId, id))
            .orderBy(posSchema.productVariants.name);

        return NextResponse.json(variants, {
            headers: { "Access-Control-Allow-Origin": "*" },
        });
    } catch (error) {
        console.error("Error fetching variants:", error);
        return NextResponse.json(
            { error: "Failed to fetch variants" },
            { status: 500 }
        );
    }
}

// POST /api/products/[id]/variants - Create a variant
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, type, priceAdjustment, stock } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Variant name is required" },
                { status: 400 }
            );
        }

        const [newVariant] = await db
            .insert(posSchema.productVariants)
            .values({
                productId: id,
                name,
                type: type || "size",
                priceAdjustment: String(priceAdjustment || 0),
                stock: stock || 0,
            })
            .returning();

        return NextResponse.json(newVariant, { status: 201 });
    } catch (error) {
        console.error("Error creating variant:", error);
        return NextResponse.json(
            { error: "Failed to create variant" },
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
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
