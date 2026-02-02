import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, gte, lte, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get("outletId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Build conditions
        const conditions = [];
        if (outletId) conditions.push(eq(posSchema.transactions.outletId, outletId));
        if (startDate) conditions.push(gte(posSchema.transactions.createdAt, new Date(startDate)));
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(posSchema.transactions.createdAt, end));
        }

        const txns = await db
            .select()
            .from(posSchema.transactions)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(asc(posSchema.transactions.createdAt));

        // Create CSV Header
        let csvContent = "Invoice,Date,Subtotal,Discount,Tax,Total,Payment Method,Status,Notes\n";

        // Add Data Rows
        txns.forEach((t) => {
            const row = [
                t.invoiceNumber,
                new Date(t.createdAt).toLocaleString('id-ID'),
                t.subtotal,
                t.discount,
                t.tax,
                t.totalAmount,
                t.paymentMethod,
                t.status,
                t.notes ? `"${t.notes.replace(/"/g, '""')}"` : "",
            ];
            csvContent += row.join(",") + "\n";
        });

        const filename = `report-sales-${new Date().toISOString().split('T')[0]}.csv`;

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename=${filename}`,
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
