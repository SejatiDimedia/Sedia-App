import { NextRequest, NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, gte, lte, inArray, count } from "drizzle-orm";
import { getOutlets } from "@/actions/outlets";

export async function GET(req: NextRequest) {
    try {
        const outlets = await getOutlets();
        if (!outlets.length) {
            return NextResponse.json({ dailyVisitors: [], outlets: [], summary: { totalVisitors: 0, todayVisitors: 0 }, locations: [] });
        }

        const allowedOutletIds = outlets.map(o => o.id);
        const { searchParams } = new URL(req.url);
        const outletId = searchParams.get("outletId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const targetOutletIds = outletId && allowedOutletIds.includes(outletId)
            ? [outletId]
            : allowedOutletIds;

        const today = new Date().toISOString().split("T")[0];

        // Build conditions
        const conditions = [inArray(posSchema.visitorLogs.outletId, targetOutletIds)];
        if (startDate) conditions.push(gte(posSchema.visitorLogs.visitDate, startDate));
        if (endDate) conditions.push(lte(posSchema.visitorLogs.visitDate, endDate));

        // Daily visitors grouped by date
        const dailyVisitors = await db
            .select({
                visitDate: posSchema.visitorLogs.visitDate,
                count: count(posSchema.visitorLogs.id),
            })
            .from(posSchema.visitorLogs)
            .where(and(...conditions))
            .groupBy(posSchema.visitorLogs.visitDate)
            .orderBy(posSchema.visitorLogs.visitDate);

        // Per-outlet breakdown
        const perOutlet = await db
            .select({
                outletId: posSchema.visitorLogs.outletId,
                count: count(posSchema.visitorLogs.id),
            })
            .from(posSchema.visitorLogs)
            .where(and(...conditions))
            .groupBy(posSchema.visitorLogs.outletId);

        // Location breakdown (by city)
        const locationBreakdown = await db
            .select({
                city: posSchema.visitorLogs.city,
                region: posSchema.visitorLogs.region,
                country: posSchema.visitorLogs.country,
                count: count(posSchema.visitorLogs.id),
            })
            .from(posSchema.visitorLogs)
            .where(and(...conditions))
            .groupBy(posSchema.visitorLogs.city, posSchema.visitorLogs.region, posSchema.visitorLogs.country);

        // Today's visitors
        const [todayStats] = await db
            .select({ count: count(posSchema.visitorLogs.id) })
            .from(posSchema.visitorLogs)
            .where(and(
                inArray(posSchema.visitorLogs.outletId, targetOutletIds),
                eq(posSchema.visitorLogs.visitDate, today)
            ));

        // Total unique visitors (all time across selected outlets)
        const [totalStats] = await db
            .select({ count: count(posSchema.visitorLogs.id) })
            .from(posSchema.visitorLogs)
            .where(inArray(posSchema.visitorLogs.outletId, targetOutletIds));

        // Enrich per-outlet data with names
        const outletMap = new Map(outlets.map(o => [o.id, o.name]));
        const perOutletWithNames = perOutlet.map(row => ({
            outletId: row.outletId,
            outletName: outletMap.get(row.outletId) || "Unknown",
            count: row.count,
        }));

        // Clean location data
        const locations = locationBreakdown
            .filter(l => l.city || l.country) // Exclude records with no location data
            .map(l => ({
                city: l.city || "Unknown",
                region: l.region || "",
                country: l.country || "Unknown",
                count: l.count,
            }))
            .sort((a, b) => b.count - a.count);

        return NextResponse.json({
            dailyVisitors,
            perOutlet: perOutletWithNames,
            locations,
            outlets: outlets.map(o => ({ id: o.id, name: o.name })),
            summary: {
                totalVisitors: totalStats?.count || 0,
                todayVisitors: todayStats?.count || 0,
            },
        });
    } catch (error) {
        console.error("[Visitor Analytics API] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
