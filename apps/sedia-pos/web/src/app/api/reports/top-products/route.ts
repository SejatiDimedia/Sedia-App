import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, gte, lte, sql, sum, count, desc, inArray } from "drizzle-orm";
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
        const outletIdParam = searchParams.get("outletId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const limit = parseInt(searchParams.get("limit") || "10");

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

        // Build where conditions for transactions
        const conditions = [];

        const TZ_OFFSET = 7 * 60 * 60 * 1000;

        if (startDate) {
            // Adjust start date to Jakarta Midnight (UTC-7)
            const d = new Date(startDate);
            d.setHours(0, 0, 0, 0);
            const adjustedStart = new Date(d.getTime() - TZ_OFFSET);
            conditions.push(gte(posSchema.transactions.createdAt, adjustedStart));
        }

        if (endDate) {
            // Adjust end date to Jakarta End of Day (UTC-7)
            const d = new Date(endDate);
            d.setDate(d.getDate() + 1);
            d.setHours(0, 0, 0, 0);
            const adjustedEnd = new Date(d.getTime() - TZ_OFFSET - 1);
            conditions.push(lte(posSchema.transactions.createdAt, adjustedEnd));
        }

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
