import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { and, gte, lte, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/reports/profit-loss - Calculate Profit & Loss
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

        const conditions = [];
        if (outletId) conditions.push(eq(posSchema.transactions.outletId, outletId));
        if (startDate) conditions.push(gte(posSchema.transactions.createdAt, new Date(startDate)));
        if (endDate) conditions.push(lte(posSchema.transactions.createdAt, new Date(endDate)));

        // 1. Calculate Total Revenue (Omzet)
        const revenueResult = await db
            .select({
                totalRevenue: sql<number>`sum(cast(${posSchema.transactions.totalAmount} as numeric))`
            })
            .from(posSchema.transactions)
            .where(and(...conditions));

        const revenue = Number(revenueResult[0]?.totalRevenue) || 0;

        // 2. Calculate COGS (HPP)
        // Need to join transaction items with transactions to filter by date
        // Note: Ideally costPrice should be snapshotted in transactionItems
        // Current schema supports costPrice in transactionItems, assuming it's populated
        const cogsResult = await db
            .select({
                totalCogs: sql<number>`sum(
                    cast(${posSchema.transactionItems.costPrice} as numeric) * 
                    ${posSchema.transactionItems.quantity}
                )`
            })
            .from(posSchema.transactionItems)
            .leftJoin(
                posSchema.transactions,
                eq(posSchema.transactionItems.transactionId, posSchema.transactions.id)
            )
            .where(and(...conditions));

        const cogs = Number(cogsResult[0]?.totalCogs) || 0;

        // 3. Calculate Gross Profit (Laba Kotor)
        const grossProfit = revenue - cogs;
        const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

        // 4. Calculate Total Discount
        const discountResult = await db
            .select({
                totalDiscount: sql<number>`sum(cast(${posSchema.transactions.discount} as numeric))`
            })
            .from(posSchema.transactions)
            .where(and(...conditions));

        const totalDiscount = Number(discountResult[0]?.totalDiscount) || 0;

        // 5. Transaction Count
        const countResult = await db
            .select({
                count: sql<number>`count(*)`
            })
            .from(posSchema.transactions)
            .where(and(...conditions));

        const transactionCount = Number(countResult[0]?.count) || 0;

        return NextResponse.json({
            revenue,
            discount: totalDiscount,
            cogs,
            grossProfit,
            profitMargin: Math.round(profitMargin * 100) / 100,
            transactionCount
        });
    } catch (error) {
        console.error("Error fetching P&L:", error);
        return NextResponse.json(
            { error: "Failed to fetch Profit & Loss report" },
            { status: 500 }
        );
    }
}
