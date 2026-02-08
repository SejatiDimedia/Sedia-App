import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";

// GET /api/categories - Fetch all categories for an outlet
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get("outletId");

        if (!outletId) {
            return NextResponse.json(
                { error: "Missing required parameter: outletId" },
                { status: 400 }
            );
        }

        const categories = await db
            .select()
            .from(posSchema.categories)
            .where(eq(posSchema.categories.outletId, outletId))
            .orderBy(posSchema.categories.name);

        return NextResponse.json(categories, {
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

// POST /api/categories - Create a new category
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, outletId } = body;

        if (!name || !outletId) {
            return NextResponse.json(
                { error: "Nama dan Outlet ID wajib diisi" },
                { status: 400 }
            );
        }

        // 1. Get Outlet to resolve Owner ID
        const outlet = await db.query.outlets.findFirst({
            where: eq(posSchema.outlets.id, outletId),
            columns: { ownerId: true }
        });

        if (!outlet) {
            return NextResponse.json(
                { error: "Outlet tidak ditemukan" },
                { status: 404 }
            );
        }

        // 2. Create Category
        const newCategory = await db.insert(posSchema.categories).values({
            name,
            outletId,
            ownerId: outlet.ownerId, // Required field
        }).returning();

        return NextResponse.json(newCategory[0], { status: 201 });
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json(
            { error: "Gagal membuat kategori" },
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
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
