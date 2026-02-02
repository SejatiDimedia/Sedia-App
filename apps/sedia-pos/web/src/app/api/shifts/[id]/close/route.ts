import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, sum, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// POST /api/shifts/[id]/close - Close shift and reconcile
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
        const { endingCash, notes } = body;

        // Get shift info
        const [shift] = await db
            .select()
            .from(posSchema.shifts)
            .where(eq(posSchema.shifts.id, id));

        if (!shift) {
            return NextResponse.json({ error: "Shift not found" }, { status: 404 });
        }

        if (shift.status === "closed") {
            return NextResponse.json({ error: "Shift already closed" }, { status: 400 });
        }

        // Calculate expected cash from transactions during shift
        // Only count CASH transactions
        // Note: In real app, we need to join with paymentMethods to check type='cash'
        // For now, assuming paymentMethod='Cash' string check
        const transactions = await db
            .select({
                total: sql<number>`sum(cast(${posSchema.transactions.totalAmount} as numeric))`
            })
            .from(posSchema.transactions)
            .where(
                and(
                    eq(posSchema.transactions.outletId, shift.outletId || ""),
                    // Only transactions created AFTER shift start
                    sql`${posSchema.transactions.createdAt} >= ${shift.startTime}`,
                    // Only CASH transactions
                    sql`lower(${posSchema.transactions.paymentMethod}) = 'cash'`
                )
            );

        const cashSales = transactions[0]?.total || 0;
        const startCash = parseFloat(shift.startingCash);
        const expectedCash = startCash + cashSales;
        const actualEndingCash = parseFloat(endingCash);
        const difference = actualEndingCash - expectedCash;

        // Close shift
        const [closedShift] = await db
            .update(posSchema.shifts)
            .set({
                endTime: new Date(),
                endingCash: String(actualEndingCash),
                expectedCash: String(expectedCash),
                difference: String(difference),
                status: "closed",
                notes,
            })
            .where(eq(posSchema.shifts.id, id))
            .returning();

        return NextResponse.json({
            ...closedShift,
            summary: {
                startCash,
                cashSales,
                expectedCash,
                actualEndingCash,
                difference,
            }
        });
    } catch (error) {
        console.error("Error closing shift:", error);
        return NextResponse.json(
            { error: "Failed to close shift" },
            { status: 500 }
        );
    }
}
