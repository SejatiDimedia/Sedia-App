import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, gte, lte, sql, sum, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/reports/summary - Get sales summary metrics
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

        // Build where conditions
        const conditions = [];

        if (outletId) {
            conditions.push(eq(posSchema.transactions.outletId, outletId));
        }

        if (startDate) {
            conditions.push(gte(posSchema.transactions.createdAt, new Date(startDate)));
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(posSchema.transactions.createdAt, end));
        }

        // Get summary metrics
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [summary] = await db
            .select({
                totalRevenue: sql<string>`COALESCE(SUM(${posSchema.transactions.totalAmount}), 0)`,
                transactionCount: count(posSchema.transactions.id),
            })
            .from(posSchema.transactions)
            .where(whereClause);

        const totalRevenue = parseFloat(summary.totalRevenue) || 0;
        const transactionCount = summary.transactionCount || 0;
        const averageTicket = transactionCount > 0 ? totalRevenue / transactionCount : 0;

        // Get today's metrics
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayConditions = [...conditions, gte(posSchema.transactions.createdAt, today)];

        const [todaySummary] = await db
            .select({
                todayRevenue: sql<string>`COALESCE(SUM(${posSchema.transactions.totalAmount}), 0)`,
                todayTransactions: count(posSchema.transactions.id),
            })
            .from(posSchema.transactions)
            .where(and(...todayConditions));

        return NextResponse.json({
            totalRevenue,
            transactionCount,
            averageTicket: Math.round(averageTicket),
            todayRevenue: parseFloat(todaySummary.todayRevenue) || 0,
            todayTransactions: todaySummary.todayTransactions || 0,
        });
    } catch (error) {
        console.error("Error fetching reports summary:", error);
        return NextResponse.json(
            { error: "Failed to fetch reports summary" },
            { status: 500 }
        );
    }
}
