import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, gte, lte, sql, sum, count, inArray } from "drizzle-orm";
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
            return NextResponse.json({
                totalRevenue: 0,
                transactionCount: 0,
                averageTicket: 0,
                todayRevenue: 0,
                todayTransactions: 0,
            });
        }


        // Build where conditions
        const conditions = [];

        if (outletIdParam) {
            if (!allowedOutletIds.includes(outletIdParam)) {
                return NextResponse.json({ error: "Forbidden: No access to this outlet" }, { status: 403 });
            }
            conditions.push(and(
                eq(posSchema.transactions.outletId, outletIdParam),
                eq(posSchema.transactions.status, "completed")
            ));
        } else {
            conditions.push(and(
                inArray(posSchema.transactions.outletId, allowedOutletIds),
                eq(posSchema.transactions.status, "completed")
            ));
        }

        const TZ_OFFSET = 7 * 60 * 60 * 1000;

        if (startDate) {
            // Robust Jakarta Start Date (00:00:00 WIB)
            // Input: "YYYY-MM-DD"
            const [y, m, d] = startDate.split('-').map(Number);
            // Create UTC midnight for that date
            const utcMidnight = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
            // Subtract offset to get Jakarta Midnight in UTC
            // 00:00 Jakarta = Previous Day 17:00 UTC
            const adjustedStart = new Date(utcMidnight - TZ_OFFSET);
            conditions.push(gte(posSchema.transactions.createdAt, adjustedStart));
        }

        if (endDate) {
            // Robust Jakarta End Date (23:59:59.999 WIB)
            // Input: "YYYY-MM-DD"
            const [y, m, d] = endDate.split('-').map(Number);
            // Create UTC End of Day for that date
            const utcEndOfDay = Date.UTC(y, m - 1, d, 23, 59, 59, 999);
            // Subtract offset
            const adjustedEnd = new Date(utcEndOfDay - TZ_OFFSET);
            conditions.push(lte(posSchema.transactions.createdAt, adjustedEnd));
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

        // Get today's metrics (Jakarta Timezone)
        // 1. Get current time in UTC
        const now = new Date();

        // 2. Add 7 hours to get "Jakarta Time" as a timestamp
        const jakartaTimestamp = now.getTime() + TZ_OFFSET;
        const jakartaDate = new Date(jakartaTimestamp);

        // 3. Extract Y-M-D from this "Jakarta Date"
        // This gives us the components of the date in Jakarta
        const y = jakartaDate.getUTCFullYear();
        const m = jakartaDate.getUTCMonth();
        const d = jakartaDate.getUTCDate();

        // 4. Create "Jakarta Midnight" in UTC terms
        // Date.UTC(y, m, d) creates a timestamp for 00:00:00 UTC on that date.
        // But since 'y,m,d' are Jakarta components, this timestamp represents 
        // 00:00:00 Jakarta IF Jakarta was UTC. 
        const jakartaMidnightAsUtc = Date.UTC(y, m, d, 0, 0, 0, 0);

        // 5. Shift back to real UTC to get the actual query parameter
        // Since Jakarta is UTC+7, 00:00 Jakarta is 17:00 (prev day) UTC.
        // So we subtract 7 hours from the "Jakarta Midnight As UTC" timestamp.
        const todayStartUtc = new Date(jakartaMidnightAsUtc - TZ_OFFSET);

        // We only want 'status=completed' for today as well
        // We reuse 'conditions' which contains outlet filter and potentially date filters. 
        // But for "Today's Revenue" box, we specifically want TODAY regardless of the date picker range.
        // So we should build fresh conditions for today.

        const todayConditions = [
            gte(posSchema.transactions.createdAt, todayStartUtc),
            eq(posSchema.transactions.status, 'completed')
        ];

        if (outletIdParam) {
            todayConditions.push(eq(posSchema.transactions.outletId, outletIdParam));
        } else {
            todayConditions.push(inArray(posSchema.transactions.outletId, allowedOutletIds));
        }

        const [todaySummary] = await db
            .select({
                todayRevenue: sql<string>`COALESCE(SUM(${posSchema.transactions.totalAmount}), 0)`,
                todayTransactions: count(posSchema.transactions.id),
            })
            .from(posSchema.transactions)
            .where(and(...todayConditions));

        // Get total products (filtered by allowed outlets)
        const productConditions = [eq(posSchema.products.isDeleted, false)];
        const customerConditions = [];

        if (outletIdParam) {
            productConditions.push(eq(posSchema.products.outletId, outletIdParam));
            customerConditions.push(eq(posSchema.customers.outletId, outletIdParam));
        } else {
            productConditions.push(inArray(posSchema.products.outletId, allowedOutletIds));
            customerConditions.push(inArray(posSchema.customers.outletId, allowedOutletIds));
        }

        const [productCount] = await db
            .select({ count: count(posSchema.products.id) })
            .from(posSchema.products)
            .where(and(...productConditions));

        const [customerCount] = await db
            .select({ count: count(posSchema.customers.id) })
            .from(posSchema.customers)
            .where(and(...customerConditions));

        return NextResponse.json({
            totalRevenue,
            transactionCount,
            averageTicket: Math.round(averageTicket),
            todayRevenue: parseFloat(todaySummary.todayRevenue) || 0,
            todayTransactions: todaySummary.todayTransactions || 0,
            totalProducts: productCount.count || 0,
            totalCustomers: customerCount.count || 0,
        });
    } catch (error) {
        console.error("Error fetching reports summary:", error);
        return NextResponse.json(
            { error: "Failed to fetch reports summary" },
            { status: 500 }
        );
    }
}
