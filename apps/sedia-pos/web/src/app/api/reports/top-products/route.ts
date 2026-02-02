import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, gte, lte, sql, sum, count, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/reports/top-products - Get top selling products
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
        const limit = parseInt(searchParams.get("limit") || "10");

        // Build where conditions for transactions
        const conditions = [];

        if (startDate) {
            conditions.push(gte(posSchema.transactions.createdAt, new Date(startDate)));
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(posSchema.transactions.createdAt, end));
        }

        if (outletId) {
            conditions.push(eq(posSchema.transactions.outletId, outletId));
        }

        // Get top products by quantity sold
        const topProducts = await db
            .select({
                productName: posSchema.transactionItems.productName,
                totalQuantity: sql<number>`CAST(SUM(${posSchema.transactionItems.quantity}) AS INTEGER)`,
                totalRevenue: sql<string>`COALESCE(SUM(${posSchema.transactionItems.total}), 0)`,
            })
            .from(posSchema.transactionItems)
            .innerJoin(
                posSchema.transactions,
                eq(posSchema.transactionItems.transactionId, posSchema.transactions.id)
            )
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .groupBy(posSchema.transactionItems.productName)
            .orderBy(desc(sql`SUM(${posSchema.transactionItems.quantity})`))
            .limit(limit);

        return NextResponse.json(
            topProducts.map((p) => ({
                name: p.productName,
                quantity: p.totalQuantity || 0,
                revenue: parseFloat(p.totalRevenue) || 0,
            }))
        );
    } catch (error) {
        console.error("Error fetching top products:", error);
        return NextResponse.json(
            { error: "Failed to fetch top products" },
            { status: 500 }
        );
    }
}
