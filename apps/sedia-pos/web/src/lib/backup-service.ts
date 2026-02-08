import { db, posSchema } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";

export async function generateBackupData(userId: string) {
    // 1. Get all outlets owned by this user
    const outlets = await db
        .select()
        .from(posSchema.outlets)
        .where(eq(posSchema.outlets.ownerId, userId));

    if (outlets.length === 0) {
        return {
            version: "1.0",
            generatedAt: new Date().toISOString(),
            data: {}
        };
    }

    const outletIds = outlets.map(o => o.id);

    // 2. Fetch all related data
    const [
        products,
        categories,
        customers,
        transactions,
        paymentMethods,
        loyaltySettings,
        memberTiers,
        roles,
        employeeOutlets,
        shifts,
        inventoryLogs,
        stockOpnames,
        heldOrders,
        pointTransactions
    ] = await Promise.all([
        db.select().from(posSchema.products).where(inArray(posSchema.products.outletId, outletIds)),
        db.select().from(posSchema.categories).where(inArray(posSchema.categories.outletId, outletIds)),
        db.select().from(posSchema.customers).where(inArray(posSchema.customers.outletId, outletIds)),
        db.select().from(posSchema.transactions).where(inArray(posSchema.transactions.outletId, outletIds)),
        db.select().from(posSchema.paymentMethods).where(inArray(posSchema.paymentMethods.outletId, outletIds)),
        db.select().from(posSchema.loyaltySettings).where(inArray(posSchema.loyaltySettings.outletId, outletIds)),
        db.select().from(posSchema.memberTiers).where(inArray(posSchema.memberTiers.outletId, outletIds)),
        db.select().from(posSchema.roles).where(inArray(posSchema.roles.outletId, outletIds)),
        db.select().from(posSchema.employeeOutlets).where(inArray(posSchema.employeeOutlets.outletId, outletIds)),
        db.select().from(posSchema.shifts).where(inArray(posSchema.shifts.outletId, outletIds)),
        db.select().from(posSchema.inventoryLogs).where(inArray(posSchema.inventoryLogs.outletId, outletIds)),
        db.select().from(posSchema.stockOpnames).where(inArray(posSchema.stockOpnames.outletId, outletIds)),
        db.select().from(posSchema.heldOrders).where(inArray(posSchema.heldOrders.outletId, outletIds)),
        db.select().from(posSchema.pointTransactions).where(inArray(posSchema.pointTransactions.outletId, outletIds)),
    ]);

    // Fetch associated data that doesn't have outletId directly
    const employeeIds = Array.from(new Set(employeeOutlets.map(eo => eo.employeeId)));
    const filteredEmployees = employeeIds.length > 0
        ? await db.select().from(posSchema.employees).where(inArray(posSchema.employees.id, employeeIds))
        : [];

    const transactionIds = transactions.map(t => t.id);
    const tItems = transactionIds.length > 0
        ? await db.select().from(posSchema.transactionItems).where(inArray(posSchema.transactionItems.transactionId, transactionIds))
        : [];

    const tPayments = transactionIds.length > 0
        ? await db.select().from(posSchema.transactionPayments).where(inArray(posSchema.transactionPayments.transactionId, transactionIds))
        : [];

    const opnameIds = stockOpnames.map(s => s.id);
    const oItems = opnameIds.length > 0
        ? await db.select().from(posSchema.stockOpnameItems).where(inArray(posSchema.stockOpnameItems.opnameId, opnameIds))
        : [];

    return {
        version: "1.0",
        generatedAt: new Date().toISOString(),
        ownerId: userId,
        data: {
            outlets,
            products,
            categories,
            customers,
            transactions,
            transactionItems: tItems,
            transactionPayments: tPayments,
            paymentMethods,
            loyaltySettings,
            memberTiers,
            roles,
            employees: filteredEmployees,
            employeeOutlets,
            shifts,
            inventoryLogs,
            pointTransactions,
            stockOpnames,
            stockOpnameItems: oItems,
            heldOrders
        }
    };
}
