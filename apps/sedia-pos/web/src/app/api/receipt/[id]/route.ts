import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch transaction
        const [transaction] = await db
            .select()
            .from(posSchema.transactions)
            .where(eq(posSchema.transactions.invoiceNumber, id));

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // Fetch items
        const items = await db
            .select()
            .from(posSchema.transactionItems)
            .where(eq(posSchema.transactionItems.transactionId, transaction.id));

        // Fetch outlet info
        const [outlet] = await db
            .select()
            .from(posSchema.outlets)
            .where(eq(posSchema.outlets.id, transaction.outletId));

        // Fetch customer if exists
        let customer = null;
        if (transaction.customerId) {
            const [customerData] = await db
                .select()
                .from(posSchema.customers)
                .where(eq(posSchema.customers.id, transaction.customerId));
            customer = customerData;
        }

        // Fetch cashier if exists
        let cashier = null;
        if (transaction.cashierId) {
            const [cashierData] = await db
                .select()
                .from(posSchema.employees)
                .where(eq(posSchema.employees.id, transaction.cashierId));
            cashier = cashierData;
        }

        return NextResponse.json({
            transaction,
            items: items.map(item => ({
                name: item.productName,
                quantity: item.quantity,
                price: parseFloat(item.price || "0"),
                total: parseFloat(item.total || "0"),
                variant: item.variantName || undefined,
            })),
            outlet: outlet ? {
                name: outlet.name,
                address: outlet.address,
                phone: outlet.phone,
            } : null,
            customer: customer ? {
                name: customer.name,
            } : null,
            cashier: cashier ? {
                name: cashier.name,
            } : null,
        });
    } catch (error) {
        console.error("Error fetching receipt data:", error);
        return NextResponse.json(
            { error: "Failed to fetch receipt data" },
            { status: 500 }
        );
    }
}
