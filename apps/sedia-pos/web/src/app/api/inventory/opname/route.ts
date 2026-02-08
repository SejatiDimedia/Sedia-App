import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/inventory/opname?outletId=...
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const outletId = searchParams.get("outletId");

    if (!outletId) {
        return NextResponse.json({ error: "Outlet ID required" }, { status: 400 });
    }

    try {
        const opnames = await db
            .select()
            .from(posSchema.stockOpnames)
            .where(eq(posSchema.stockOpnames.outletId, outletId))
            .orderBy(desc(posSchema.stockOpnames.date));

        return NextResponse.json(opnames);
    } catch (error) {
        console.error("Failed to fetch opnames:", error);
        return NextResponse.json({ error: "Failed to fetch stock opnames" }, { status: 500 });
    }
}

// POST /api/inventory/opname - Create new session
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { outletId, notes, categoryId } = body;

        if (!outletId) {
            return NextResponse.json({ error: "Outlet ID required" }, { status: 400 });
        }

        // 1. Create Opname Header
        const [opname] = await db.insert(posSchema.stockOpnames).values({
            outletId,
            notes,
            createdBy: session.user.id,
            status: "pending"
        }).returning();

        // 2. Snapshot Products
        // Create standard conditions array
        const conditions = [
            eq(posSchema.products.outletId, outletId),
            // eq(posSchema.products.trackStock, true), // Optional: only verify tracked items
            eq(posSchema.products.isActive, true)
        ];

        if (categoryId && categoryId !== 'all') {
            conditions.push(eq(posSchema.products.categoryId, categoryId));
        }

        const productsToCount = await db.query.products.findMany({
            where: and(...conditions),
            with: {
                variants: {
                    where: eq(posSchema.productVariants.isActive, true)
                }
            }
        });

        console.log(`[Opname API] Found ${productsToCount.length} products to count for outlet ${outletId}`);

        // 3. Insert Opname Items
        const itemsToInsert: {
            opnameId: string;
            productId: string;
            variantId: string | null;
            systemStock: number;
            actualStock: number | null;
            difference: number | null;
        }[] = [];

        for (const p of productsToCount) {
            if (p.variants && p.variants.length > 0) {
                // If product has variants, snapshot each variant
                for (const v of p.variants) {
                    itemsToInsert.push({
                        opnameId: opname.id,
                        productId: p.id,
                        variantId: v.id,
                        systemStock: v.stock || 0,
                        actualStock: null,
                        difference: null
                    });
                }
            } else {
                // If no variants, snapshot the product itself
                itemsToInsert.push({
                    opnameId: opname.id,
                    productId: p.id,
                    variantId: null,
                    systemStock: p.stock,
                    actualStock: null,
                    difference: null
                });
            }
        }

        console.log(`[Opname API] Inserting ${itemsToInsert.length} items into Opname ${opname.id}`);

        if (itemsToInsert.length > 0) {
            try {
                await db.insert(posSchema.stockOpnameItems).values(itemsToInsert as any);
            } catch (insertErr) {
                console.error("[Opname API] Failed to insert items:", insertErr);
                throw insertErr;
            }
        }

        console.log(`[Opname API] Successfully created opname ${opname.id}`);
        return NextResponse.json(opname, { status: 201 });

    } catch (error) {
        console.error("[Opname API] Failed to create opname:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: "Failed to create stock opname", detail: message }, { status: 500 });
    }
}
