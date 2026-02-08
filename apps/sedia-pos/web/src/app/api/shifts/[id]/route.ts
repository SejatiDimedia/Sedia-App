import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/shifts/[id] - Get shift details
export async function GET(
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

        // Get shift info with employee
        const [shift] = await db
            .select({
                shift: posSchema.shifts,
                employee: {
                    name: posSchema.employees.name,
                },
            })
            .from(posSchema.shifts)
            .leftJoin(
                posSchema.employees,
                eq(posSchema.shifts.employeeId, posSchema.employees.id)
            )
            .where(eq(posSchema.shifts.id, id));

        if (!shift) {
            return NextResponse.json({ error: "Shift not found" }, { status: 404 });
        }

        const startTime = shift.shift.startTime;
        const endTime = shift.shift.endTime || new Date();
        const outletId = shift.shift.outletId || "";

        // Calculate sales summary (grouped by payment method)
        const transactionSummary = await db
            .select({
                method: posSchema.transactions.paymentMethod,
                total: sql<number>`sum(cast(${posSchema.transactions.totalAmount} as numeric))`,
                count: sql<number>`count(*)`,
            })
            .from(posSchema.transactions)
            .where(
                and(
                    eq(posSchema.transactions.outletId, outletId),
                    gte(posSchema.transactions.createdAt, startTime),
                    lte(posSchema.transactions.createdAt, endTime)
                )
            )
            .groupBy(posSchema.transactions.paymentMethod);

        const summary = {
            cashSales: 0,
            nonCashSales: 0,
            totalSales: 0,
            transactionCount: 0,
        };

        transactionSummary.forEach((t) => {
            const amount = Number(t.total);
            const count = Number(t.count);
            summary.totalSales += amount;
            summary.transactionCount += count;
            if (t.method?.toLowerCase() === "cash") {
                summary.cashSales += amount;
            } else {
                summary.nonCashSales += amount;
            }
        });

        // Calculate expected ending cash
        const expectedCash = Number(shift.shift.startingCash) + summary.cashSales;

        // Fetch detailed transaction list with payment method name
        const transactionsList = await db
            .select({
                id: posSchema.transactions.id,
                createdAt: posSchema.transactions.createdAt,
                totalAmount: posSchema.transactions.totalAmount,
                paymentMethod: posSchema.paymentMethods.name,
                paymentMethodType: posSchema.paymentMethods.type,
                invoiceNumber: posSchema.transactions.invoiceNumber,
            })
            .from(posSchema.transactions)
            .leftJoin(
                posSchema.paymentMethods,
                eq(posSchema.transactions.paymentMethod, posSchema.paymentMethods.id)
            )
            .where(
                and(
                    eq(posSchema.transactions.outletId, outletId),
                    gte(posSchema.transactions.createdAt, startTime),
                    lte(posSchema.transactions.createdAt, endTime)
                )
            )
            .orderBy(posSchema.transactions.createdAt);

        // Fetch product sales summary during shift (stock reductions from sales)
        // Get all transaction IDs for this shift period
        const shiftTransactionIds = transactionsList.map(t => t.id);

        let productSales: { productName: string | null; variantName: string | null; totalQuantity: number; unitPrice: number; totalRevenue: number }[] = [];

        if (shiftTransactionIds.length > 0) {
            // Get all transaction items and aggregate by product/variant
            const transactionItems = await db
                .select({
                    productName: posSchema.transactionItems.productName,
                    variantName: posSchema.transactionItems.variantName,
                    quantity: posSchema.transactionItems.quantity,
                    price: posSchema.transactionItems.price,
                    total: posSchema.transactionItems.total,
                })
                .from(posSchema.transactionItems)
                .where(
                    sql`${posSchema.transactionItems.transactionId} IN (${sql.join(shiftTransactionIds.map(id => sql`${id}`), sql`, `)})`
                );

            // Aggregate quantities by product+variant
            const salesMap = new Map<string, { productName: string; variantName: string | null; totalQuantity: number; unitPrice: number; totalRevenue: number }>();

            for (const item of transactionItems) {
                const key = `${item.productName}|${item.variantName || ''}`;
                // Robust parsing - handle null, undefined, empty string, or invalid values
                const parsedPrice = Number(item.price);
                const parsedTotal = Number(item.total);
                const itemPrice = isNaN(parsedPrice) ? 0 : parsedPrice;
                const itemTotal = isNaN(parsedTotal) ? (itemPrice * item.quantity) : parsedTotal;

                const existing = salesMap.get(key);
                if (existing) {
                    existing.totalQuantity += item.quantity;
                    existing.totalRevenue += itemTotal;
                } else {
                    salesMap.set(key, {
                        productName: item.productName || 'Unknown Product',
                        variantName: item.variantName,
                        totalQuantity: item.quantity,
                        unitPrice: itemPrice,
                        totalRevenue: itemTotal,
                    });
                }
            }

            productSales = Array.from(salesMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
        }

        return NextResponse.json({
            ...shift.shift,
            employeeName: shift.employee?.name,
            summary: {
                ...summary,
                expectedCash,
            },
            transactions: transactionsList,
            productSales: productSales, // Stock reductions from customer purchases
        });
    } catch (error) {
        console.error("Error fetching shift details:", error);
        return NextResponse.json(
            { error: "Failed to fetch shift details" },
            { status: 500 }
        );
    }
}

