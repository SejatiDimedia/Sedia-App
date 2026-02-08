import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, gte, lte, sql, sum, count, inArray } from "drizzle-orm";
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
        const outletIdParam = searchParams.get("outletId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // 1. Determine allowed outlets for this user
        let allowedOutletIds: string[] = [];

        // Check if user is an owner
        const ownedOutlets = await db
            .select({ id: posSchema.outlets.id })
            .from(posSchema.outlets)
            .where(eq(posSchema.outlets.ownerId, session.user.id));

        allowedOutletIds = ownedOutlets.map(o => o.id);

        // Check if user is an employee
        if (allowedOutletIds.length === 0) {
            const employee = await db.query.employees.findFirst({
                where: and(
                    eq(posSchema.employees.userId, session.user.id),
                    eq(posSchema.employees.isDeleted, false)
                ),
                with: {
                    outlet: true,
                    employeeOutlets: {
                        with: {
                            outlet: true
                        }
                    }
                }
            });

            if (employee) {
                const assignedIds = employee.employeeOutlets
                    ?.map(eo => eo.outlet?.id)
                    .filter(Boolean) as string[] || [];

                allowedOutletIds = [...assignedIds];

                if (employee.outlet?.id && !allowedOutletIds.includes(employee.outlet.id)) {
                    allowedOutletIds.push(employee.outlet.id);
                }
            }
        }

        if (allowedOutletIds.length === 0) {
            return NextResponse.json([]);
        }

        // Default to last 7 days if no dates provided
        // We need to handle Timezone manually because the server counts in UTC.
        // Jakarta is UTC+7. So 00:00 Jakarta is previous day 17:00 UTC.
        const TZ_OFFSET = 7 * 60 * 60 * 1000; // 7 hours in ms

        let start: Date;
        let end: Date;

        if (endDate) {
            // Robust Jakarta End Date logic
            const [y, m, d] = endDate.split('-').map(Number);
            const utcEndOfDay = Date.UTC(y, m - 1, d, 23, 59, 59, 999);
            end = new Date(utcEndOfDay - TZ_OFFSET);
        } else {
            // Default: End of today in Jakarta
            const now = new Date();
            const jakartaNowTimestamp = now.getTime() + TZ_OFFSET;
            const jakartaDate = new Date(jakartaNowTimestamp);
            // End of this jakarta day
            const utcEndOfDay = Date.UTC(jakartaDate.getUTCFullYear(), jakartaDate.getUTCMonth(), jakartaDate.getUTCDate(), 23, 59, 59, 999);
            end = new Date(utcEndOfDay - TZ_OFFSET);
        }

        if (startDate) {
            // Robust Jakarta Start Date logic
            const [y, m, d] = startDate.split('-').map(Number);
            const utcMidnight = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
            start = new Date(utcMidnight - TZ_OFFSET);
        } else {
            // Default last 7 days from END
            // start = end - 6 days (roughly, but let's align to midnight)
            const endTime = end.getTime();
            // Go back 6 full days from the end time, then snap to midnight of that day?
            // Safer: Take the end DATE, subtract 6 days, set to midnight.
            const endJakartaTimestamp = end.getTime() + TZ_OFFSET;
            const endJakartaDate = new Date(endJakartaTimestamp);

            const startJakartaDate = new Date(endJakartaDate);
            startJakartaDate.setUTCDate(startJakartaDate.getUTCDate() - 6);

            const utcMidnight = Date.UTC(startJakartaDate.getUTCFullYear(), startJakartaDate.getUTCMonth(), startJakartaDate.getUTCDate(), 0, 0, 0, 0);
            start = new Date(utcMidnight - TZ_OFFSET);
        }

        // Build where conditions
        const conditions = [
            gte(posSchema.transactions.createdAt, start),
            lte(posSchema.transactions.createdAt, end),
            eq(posSchema.transactions.status, "completed"),
        ];

        if (outletIdParam) {
            if (!allowedOutletIds.includes(outletIdParam)) {
                return NextResponse.json({ error: "Forbidden: No access to this outlet" }, { status: 403 });
            }
            conditions.push(eq(posSchema.transactions.outletId, outletIdParam));
        } else {
            conditions.push(inArray(posSchema.transactions.outletId, allowedOutletIds));
        }

        // Aggregate sales by date
        const salesByDate = await db
            .select({
                date: sql<string>`DATE(${posSchema.transactions.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')`,
                revenue: sql<string>`COALESCE(SUM(${posSchema.transactions.totalAmount}), 0)`,
                transactions: count(posSchema.transactions.id),
            })
            .from(posSchema.transactions)
            .where(and(...conditions))
            .groupBy(sql`DATE(${posSchema.transactions.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')`)
            .orderBy(sql`DATE(${posSchema.transactions.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')`);

        // Fill in missing dates with zero values
        const result = [];

        // Use a clean loop based on the requested start/end dates string
        // We know start and end variables are set to the exact timestamps for DB query
        // We need to iterate from day 0 to day N based on Jakarta dates

        // Calculate number of days
        const oneDay = 24 * 60 * 60 * 1000;
        const startTime = start.getTime(); // 17:00 date-1
        const endTime = end.getTime();     // 16:59 date-N

        // Robust iteration: start from the initial timestamp and simply add 24h steps
        // The check 'iterTime < endTime + extra_buffer' ensures we catch the last day 
        // even if milliseconds are off.

        let iterTime = startTime;
        // buffer to ensure we cover the full range of the end date till the next boundary
        const endBoundary = endTime + 10000;

        while (iterTime < endBoundary) {
            // Convert current iteration timestamp to Jakarta Date String
            const iterDate = new Date(iterTime + TZ_OFFSET);
            const dateStr = iterDate.toISOString().split("T")[0];

            const existing = salesByDate.find((s) => s.date === dateStr);

            result.push({
                date: dateStr,
                revenue: existing ? parseFloat(existing.revenue) : 0,
                transactions: existing ? existing.transactions : 0,
            });

            // Advance 1 day
            iterTime += oneDay;
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
