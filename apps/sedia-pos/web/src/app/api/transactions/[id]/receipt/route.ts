import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/transactions/[id]/receipt - Get receipt data
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

        // Get transaction with items
        const [transaction] = await db
            .select()
            .from(posSchema.transactions)
            .where(eq(posSchema.transactions.id, id));

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // Get transaction items
        const items = await db
            .select()
            .from(posSchema.transactionItems)
            .where(eq(posSchema.transactionItems.transactionId, id));

        // Get outlet info
        const [outlet] = await db
            .select()
            .from(posSchema.outlets)
            .where(eq(posSchema.outlets.id, transaction.outletId));

        // Get customer info if exists
        let customer = null;
        if (transaction.customerId) {
            const [customerData] = await db
                .select()
                .from(posSchema.customers)
                .where(eq(posSchema.customers.id, transaction.customerId));
            customer = customerData || null;
        }

        // Get cashier info if exists
        let cashier = null;
        if (transaction.cashierId) {
            const [employeeData] = await db
                .select()
                .from(posSchema.employees)
                .where(eq(posSchema.employees.id, transaction.cashierId));
            cashier = employeeData || null;
        }

        // Get tax settings
        const [taxSettingsData] = await db
            .select()
            .from(posSchema.taxSettings)
            .where(eq(posSchema.taxSettings.outletId, transaction.outletId));

        return NextResponse.json({
            transaction: {
                ...transaction,
                taxDetails: taxSettingsData && Number(transaction.tax) > 0 ? {
                    name: taxSettingsData.name,
                    rate: taxSettingsData.rate,
                    isInclusive: taxSettingsData.isInclusive
                } : null
            },
            items,
            outlet,
            customer,
            cashier,
        });
    } catch (error) {
        console.error("Error fetching receipt:", error);
        return NextResponse.json(
            { error: "Failed to fetch receipt" },
            { status: 500 }
        );
    }
}
