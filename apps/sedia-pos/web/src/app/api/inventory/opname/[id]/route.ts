import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/inventory/opname/[id] - Get details
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const opname = await db
            .select()
            .from(posSchema.stockOpnames)
            .where(eq(posSchema.stockOpnames.id, id))
            .limit(1);

        if (!opname || opname.length === 0) {
            return NextResponse.json({ error: "Opname not found" }, { status: 404 });
        }

        const opnameData = opname[0];

        const items = await db
            .select({
                id: posSchema.stockOpnameItems.id,
                productId: posSchema.stockOpnameItems.productId,
                systemStock: posSchema.stockOpnameItems.systemStock,
                actualStock: posSchema.stockOpnameItems.actualStock,
                difference: posSchema.stockOpnameItems.difference,
                notes: posSchema.stockOpnameItems.notes,
                productName: posSchema.products.name,
                productSku: posSchema.products.sku,
            })
            .from(posSchema.stockOpnameItems)
            .leftJoin(posSchema.products, eq(posSchema.stockOpnameItems.productId, posSchema.products.id))
            .where(eq(posSchema.stockOpnameItems.opnameId, id));

        const response = {
            ...opnameData,
            items: items.map(item => ({
                id: item.id,
                productId: item.productId,
                systemStock: item.systemStock,
                actualStock: item.actualStock,
                difference: item.difference,
                notes: item.notes,
                product: {
                    name: item.productName || '',
                    sku: item.productSku || ''
                }
            }))
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching opname:", error);
        return NextResponse.json({ error: "Failed to fetch opname details" }, { status: 500 });
    }
}

// PUT /api/inventory/opname/[id] - Update items (Save Draft)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const body = await request.json();
        const { items } = body; // Array of { id (itemId), actualStock, notes }

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: "Invalid items format" }, { status: 400 });
        }

        // Loop and update
        for (const item of items) {
            if (item.id && (item.actualStock !== undefined || item.notes !== undefined)) {
                const updates: any = {};

                // If actualStock is provided, update it and recalculate difference
                if (item.actualStock !== undefined) {
                    // Fetch current item to get systemStock for diff calculation
                    const currentItem = await db
                        .select({ systemStock: posSchema.stockOpnameItems.systemStock })
                        .from(posSchema.stockOpnameItems)
                        .where(eq(posSchema.stockOpnameItems.id, item.id))
                        .limit(1);

                    if (currentItem && currentItem.length > 0) {
                        const actual = parseInt(String(item.actualStock));
                        updates.actualStock = actual;
                        updates.difference = actual - currentItem[0].systemStock;
                    } else {
                        // Parse potential string input
                        const actual = parseInt(String(item.actualStock));
                        updates.actualStock = actual;
                    }
                }

                if (item.notes !== undefined) updates.notes = item.notes;

                await db.update(posSchema.stockOpnameItems)
                    .set(updates)
                    .where(eq(posSchema.stockOpnameItems.id, item.id));
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating opname:", error);
        return NextResponse.json({ error: "Failed to update opname" }, { status: 500 });
    }
}
