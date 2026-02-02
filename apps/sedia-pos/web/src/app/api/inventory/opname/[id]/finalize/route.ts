import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// POST /api/inventory/opname/[id]/finalize
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get Status
        const opnameResult = await db
            .select()
            .from(posSchema.stockOpnames)
            .where(eq(posSchema.stockOpnames.id, id))
            .limit(1);

        if (!opnameResult || opnameResult.length === 0) return NextResponse.json({ error: "Opname not found" }, { status: 404 });

        const opname = opnameResult[0];
        if (opname.status === 'completed') return NextResponse.json({ error: "Opname already completed" }, { status: 400 });

        // Get Changed Items
        const changedItems = await db
            .select()
            .from(posSchema.stockOpnameItems)
            .where(eq(posSchema.stockOpnameItems.opnameId, id));

        const adjustments = changedItems.filter(i => i.difference !== null && i.difference !== 0);

        // Process adjustments
        for (const item of adjustments) {
            if (item.difference) {
                // Get current fresh stock
                const freshProductResult = await db
                    .select({ stock: posSchema.products.stock })
                    .from(posSchema.products)
                    .where(eq(posSchema.products.id, item.productId))
                    .limit(1);

                if (freshProductResult && freshProductResult.length > 0) {
                    const freshProduct = freshProductResult[0];
                    await db.update(posSchema.products)
                        .set({ stock: freshProduct.stock + item.difference })
                        .where(eq(posSchema.products.id, item.productId));

                    // Log
                    await db.insert(posSchema.inventoryLogs).values({
                        outletId: opname.outletId,
                        productId: item.productId,
                        type: "adjustment",
                        quantity: item.difference,
                        notes: `Stock Opname (Diff: ${item.difference})`,
                        createdBy: session.user.id
                    });
                }
            }
        }

        // Complete Opname
        await db.update(posSchema.stockOpnames)
            .set({ status: 'completed' })
            .where(eq(posSchema.stockOpnames.id, id));

        return NextResponse.json({ success: true, adjustmentsCount: adjustments.length });

    } catch (error) {
        console.error("Error finalizing opname:", error);
        return NextResponse.json({ error: "Failed to finalize opname" }, { status: 500 });
    }
}
