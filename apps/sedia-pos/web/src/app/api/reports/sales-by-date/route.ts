import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, gte, lte, sql, sum, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/reports/sales-by-date - Get sales aggregated by date
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
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Default to last 7 days if no dates provided
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const start = startDate ? new Date(startDate) : new Date(end);
        if (!startDate) {
            start.setDate(start.getDate() - 6);
        }
        start.setHours(0, 0, 0, 0);

        // Build where conditions
        const conditions = [
            gte(posSchema.transactions.createdAt, start),
            lte(posSchema.transactions.createdAt, end),
        ];

        if (outletId) {
            conditions.push(eq(posSchema.transactions.outletId, outletId));
        }

        // Aggregate sales by date
        const salesByDate = await db
            .select({
                date: sql<string>`DATE(${posSchema.transactions.createdAt})`,
                revenue: sql<string>`COALESCE(SUM(${posSchema.transactions.totalAmount}), 0)`,
                transactions: count(posSchema.transactions.id),
            })
            .from(posSchema.transactions)
            .where(and(...conditions))
            .groupBy(sql`DATE(${posSchema.transactions.createdAt})`)
            .orderBy(sql`DATE(${posSchema.transactions.createdAt})`);

        // Fill in missing dates with zero values
        const result = [];
        const current = new Date(start);

        while (current <= end) {
            const dateStr = current.toISOString().split("T")[0];
            const existing = salesByDate.find((s) => s.date === dateStr);

            result.push({
                date: dateStr,
                revenue: existing ? parseFloat(existing.revenue) : 0,
                transactions: existing ? existing.transactions : 0,
            });

            current.setDate(current.getDate() + 1);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching sales by date:", error);
        return NextResponse.json(
            { error: "Failed to fetch sales by date" },
            { status: 500 }
        );
    }
}
