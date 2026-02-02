import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { and, gte, lte, eq, sql, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const transactions = await db
            .select({
                id: posSchema.transactions.id,
                invoiceNumber: posSchema.transactions.invoiceNumber,
                createdAt: posSchema.transactions.createdAt,
                subtotal: posSchema.transactions.subtotal,
                discount: posSchema.transactions.discount,
                tax: posSchema.transactions.tax,
                totalAmount: posSchema.transactions.totalAmount,
                paymentMethod: posSchema.transactions.paymentMethod,
                status: posSchema.transactions.status,
                customerName: sql<string>`(
                    SELECT ${posSchema.customers.name}
                    FROM ${posSchema.customers}
                    WHERE ${posSchema.customers.id} = ${posSchema.transactions.customerId}
                )`,
                items: sql<string>`json_agg(
                    json_build_object(
                        'productName', ${posSchema.transactionItems.productName},
                        'quantity', ${posSchema.transactionItems.quantity},
                        'price', ${posSchema.transactionItems.price},
                        'costPrice', ${posSchema.transactionItems.costPrice},
                        'total', ${posSchema.transactionItems.total}
                    )
                )`
            })
            .from(posSchema.transactions)
            .leftJoin(
                posSchema.transactionItems,
                eq(posSchema.transactionItems.transactionId, posSchema.transactions.id)
            )
            .where(whereClause)
            .groupBy(posSchema.transactions.id)
            .orderBy(desc(posSchema.transactions.createdAt));

        let totalRevenue = 0;
        let totalCogs = 0;
        let totalDiscount = 0;

        const rows: any[] = transactions.flatMap((t) => {
            const items = Array.isArray(t.items) ? t.items : [];
            const transactionRevenue = Number(t.totalAmount);
            const transactionCogs = items.reduce(
                (sum, item) => sum + (Number(item.costPrice) * item.quantity),
                0
            );

            totalRevenue += transactionRevenue;
            totalCogs += transactionCogs;
            totalDiscount += Number(t.discount);

            return items.map((item: any) => ({
                Invoice: t.invoiceNumber,
                Date: new Date(t.createdAt).toLocaleDateString("id-ID"),
                Time: new Date(t.createdAt).toLocaleTimeString("id-ID"),
                Customer: t.customerName || "-",
                Product: item.productName,
                Quantity: item.quantity,
                "Unit Price": Number(item.price),
                "Cost Price": Number(item.costPrice) || 0,
                "Total Sales": Number(item.total),
                "Cost (HPP)": Number(item.costPrice) * item.quantity,
                "Gross Profit": Number(item.total) - (Number(item.costPrice) * item.quantity),
                "Margin %": item.costPrice
                    ? ((Number(item.total) - Number(item.costPrice) * item.quantity) / Number(item.total)) * 100
                    : 0,
                Payment: t.paymentMethod,
                Status: t.status,
            }));
        });

        const grossProfit = totalRevenue - totalCogs;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        rows.push({});
        rows.push({ "": "SUMMARY" });
        rows.push({ "Total Revenue (Omzet)": totalRevenue });
        rows.push({ "Total Discount": totalDiscount });
        rows.push({ "Harga Pokok Penjualan (HPP)": totalCogs });
        rows.push({ "Laba Kotor (Gross Profit)": grossProfit });
        rows.push({ "Profit Margin": `${profitMargin.toFixed(2)}%` });

        let csvContent = Object.keys(rows[0]).join(",") + "\n";
        rows.forEach((row: any) => {
            const values = Object.values(row).map((val: any) => {
                if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                if (typeof val === "number") {
                    return val.toFixed(2);
                }
                return val || "";
            });
            csvContent += values.join(",") + "\n";
        });

        const filename = `profit-loss-${new Date().toISOString().split("T")[0]}.csv`;

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json(
            { error: "Failed to export Profit & Loss report" },
            { status: 500 }
        );
    }
}
