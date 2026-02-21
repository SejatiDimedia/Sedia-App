import { NextRequest, NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, gte, lte, inArray, count, sql, desc, min } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { outlets, employees } from "@/lib/schema/sedia-pos";

export async function GET(req: NextRequest) {
    try {
        // Step 0: Session Detection
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({
                dailyVisitors: [],
                outlets: [],
                summary: { totalVisitors: 0, todayVisitors: 0, totalWaClicks: 0, conversionRate: 0 },
                locations: [],
                hotProducts: [],
                peakHours: [],
                loyalty: { new: 0, returning: 0 }
            });
        }

        const userId = session.user.id;

        // Step 1: Get Outlets (Owner + Employee)
        const ownedOutlets = await db.query.outlets.findMany({
            where: eq(outlets.ownerId, userId),
        });

        const employee = await db.query.employees.findFirst({
            where: and(
                eq(employees.userId, userId),
                eq(employees.isDeleted, false)
            ),
            with: {
                outlet: true,
                employeeOutlets: {
                    with: { outlet: true }
                }
            }
        });

        const outletMap = new Map<string, any>();
        ownedOutlets.forEach(o => outletMap.set(o.id, o));
        if (employee) {
            employee.employeeOutlets?.forEach((eo: any) => {
                if (eo.outlet) outletMap.set(eo.outlet.id, eo.outlet);
            });
            if (employee.outlet) outletMap.set(employee.outlet.id, employee.outlet);
        }

        const allOutlets = Array.from(outletMap.values());

        if (!allOutlets.length) {
            return NextResponse.json({
                dailyVisitors: [],
                outlets: [],
                summary: { totalVisitors: 0, todayVisitors: 0, totalWaClicks: 0, conversionRate: 0 },
                locations: [],
                hotProducts: [],
                peakHours: [],
                loyalty: { new: 0, returning: 0 }
            });
        }

        const allowedOutletIds = allOutlets.map(o => o.id);
        const { searchParams } = new URL(req.url);
        const outletId = searchParams.get("outletId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const targetOutletIds = outletId && allowedOutletIds.includes(outletId)
            ? [outletId]
            : allowedOutletIds;

        // Use Jakarta Time for "Today"
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());


        // Build conditions
        const conditions = [inArray(posSchema.visitorLogs.outletId, targetOutletIds)];
        const eventConditions = [inArray(posSchema.catalogEvents.outletId, targetOutletIds)];

        if (startDate) {
            conditions.push(gte(posSchema.visitorLogs.visitDate, startDate));
            eventConditions.push(gte(posSchema.catalogEvents.eventDate, startDate));
        }
        if (endDate) {
            conditions.push(lte(posSchema.visitorLogs.visitDate, endDate));
            eventConditions.push(lte(posSchema.catalogEvents.eventDate, endDate));
        }

        // 1. Daily visitors
        const dailyVisitors = await db
            .select({
                visitDate: posSchema.visitorLogs.visitDate,
                count: count(posSchema.visitorLogs.id),
            })
            .from(posSchema.visitorLogs)
            .where(and(...conditions))
            .groupBy(posSchema.visitorLogs.visitDate)
            .orderBy(posSchema.visitorLogs.visitDate);

        // 2. Per-outlet breakdown
        const perOutlet = await db
            .select({
                outletId: posSchema.visitorLogs.outletId,
                count: count(posSchema.visitorLogs.id),
            })
            .from(posSchema.visitorLogs)
            .where(and(...conditions))
            .groupBy(posSchema.visitorLogs.outletId);

        // 3. Location breakdown
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

        // 4. Hot Products
        const hotProducts = await db
            .select({
                productId: posSchema.catalogEvents.productId,
                name: posSchema.products.name,
                viewCount: count(posSchema.catalogEvents.id),
            })
            .from(posSchema.catalogEvents)
            .leftJoin(posSchema.products, eq(posSchema.catalogEvents.productId, posSchema.products.id))
            .where(and(
                ...eventConditions,
                eq(posSchema.catalogEvents.eventType, "product_view"),
                sql`${posSchema.catalogEvents.productId} IS NOT NULL`
            ))
            .groupBy(posSchema.catalogEvents.productId, posSchema.products.name)
            .orderBy(desc(count(posSchema.catalogEvents.id)))
            .limit(10);

        // 5. Peak Hours
        const hourExpr = sql`EXTRACT(HOUR FROM ${posSchema.visitorLogs.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')`;
        const peakHoursResults = await db
            .select({
                hour: sql<number>`${hourExpr}`,
                count: count(posSchema.visitorLogs.id),
            })
            .from(posSchema.visitorLogs)
            .where(and(...conditions))
            .groupBy(hourExpr)
            .orderBy(hourExpr);

        const peakHours = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            count: peakHoursResults.find(r => Number(r.hour) === i)?.count || 0
        }));

        // 6. Visitor Loyalty
        const visitorsInRange = await db
            .select({ visitorId: posSchema.visitorLogs.visitorId })
            .from(posSchema.visitorLogs)
            .where(and(...conditions))
            .groupBy(posSchema.visitorLogs.visitorId);

        const visitorIds = visitorsInRange.map(v => v.visitorId);

        let returningCount = 0;
        let newCount = 0;

        if (visitorIds.length > 0) {
            const loyaltyCheck = await db
                .select({
                    visitorId: posSchema.visitorLogs.visitorId,
                    firstVisitOverall: min(posSchema.visitorLogs.visitDate)
                })
                .from(posSchema.visitorLogs)
                .where(inArray(posSchema.visitorLogs.visitorId, visitorIds))
                .groupBy(posSchema.visitorLogs.visitorId);

            loyaltyCheck.forEach(v => {
                if (startDate && v.firstVisitOverall && v.firstVisitOverall < startDate) {
                    returningCount++;
                } else {
                    newCount++;
                }
            });
        }

        // 7. Event Summary
        const eventSummary = await db
            .select({
                eventType: posSchema.catalogEvents.eventType,
                count: count(posSchema.catalogEvents.id),
            })
            .from(posSchema.catalogEvents)
            .where(and(...eventConditions))
            .groupBy(posSchema.catalogEvents.eventType);

        const waClicks = eventSummary.find(e => e.eventType === "wa_click")?.count || 0;
        const addToCart = eventSummary.find(e => e.eventType === "add_to_cart")?.count || 0;

        // 8. Stats
        const [todayStats] = await db
            .select({ count: count(posSchema.visitorLogs.id) })
            .from(posSchema.visitorLogs)
            .where(and(
                inArray(posSchema.visitorLogs.outletId, targetOutletIds),
                eq(posSchema.visitorLogs.visitDate, today)
            ));

        const [totalStats] = await db
            .select({ count: count(posSchema.visitorLogs.id) })
            .from(posSchema.visitorLogs)
            .where(inArray(posSchema.visitorLogs.outletId, targetOutletIds));

        const outletNameMap = new Map(allOutlets.map(o => [o.id, o.name]));

        return NextResponse.json({
            dailyVisitors,
            perOutlet: perOutlet.map(row => ({
                outletId: row.outletId,
                outletName: outletNameMap.get(row.outletId) || "Unknown",
                count: row.count,
            })),
            locations: locationBreakdown
                .filter(l => l.city || l.country)
                .map(l => ({
                    city: l.city || "Unknown",
                    region: l.region || "",
                    country: l.country || "Unknown",
                    count: l.count,
                })).sort((a, b) => b.count - a.count),
            hotProducts,
            peakHours,
            loyalty: { new: newCount, returning: returningCount, total: visitorIds.length },
            outlets: allOutlets.map(o => ({ id: o.id, name: o.name })),
            summary: {
                totalVisitors: totalStats?.count || 0,
                todayVisitors: todayStats?.count || 0,
                totalWaClicks: waClicks,
                totalAddToCart: addToCart,
                conversionRate: Number((dailyVisitors.reduce((a, c) => a + c.count, 0) > 0 ? (waClicks / dailyVisitors.reduce((a, c) => a + c.count, 0)) * 100 : 0).toFixed(2)),
            },
        });
    } catch (error: any) {
        console.error("[Visitor Analytics API] Error:", error?.message);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
