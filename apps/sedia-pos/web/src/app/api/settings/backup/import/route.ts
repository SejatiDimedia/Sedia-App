import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/logging";

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { version, data, ownerId } = body;

        if (!data || ownerId !== session.user.id) {
            return NextResponse.json({ error: "Invalid backup file or unauthorized" }, { status: 400 });
        }

        // 1. Identify current outlets owned by user
        const currentOutlets = await db
            .select()
            .from(posSchema.outlets)
            .where(eq(posSchema.outlets.ownerId, session.user.id));

        const currentOutletIds = currentOutlets.map(o => o.id);

        // 2. Clear existing data for these outlets
        // We do this in reverse order of foreign keys
        if (currentOutletIds.length > 0) {
            // Fetch relevant parent IDs for focused deletion
            const transactionIds = (await db.select({ id: posSchema.transactions.id }).from(posSchema.transactions).where(inArray(posSchema.transactions.outletId, currentOutletIds))).map(t => t.id);
            const productIds = (await db.select({ id: posSchema.products.id }).from(posSchema.products).where(inArray(posSchema.products.outletId, currentOutletIds))).map(t => t.id);
            const opnameIds = (await db.select({ id: posSchema.stockOpnames.id }).from(posSchema.stockOpnames).where(inArray(posSchema.stockOpnames.outletId, currentOutletIds))).map(t => t.id);

            // Level 5 (Items/Logs)
            if (transactionIds.length > 0) {
                await db.delete(posSchema.transactionItems).where(inArray(posSchema.transactionItems.transactionId, transactionIds));
                await db.delete(posSchema.transactionPayments).where(inArray(posSchema.transactionPayments.transactionId, transactionIds));
            }
            await db.delete(posSchema.inventoryLogs).where(inArray(posSchema.inventoryLogs.outletId, currentOutletIds));
            if (opnameIds.length > 0) {
                await db.delete(posSchema.stockOpnameItems).where(inArray(posSchema.stockOpnameItems.opnameId, opnameIds));
            }
            await db.delete(posSchema.pointTransactions).where(inArray(posSchema.pointTransactions.outletId, currentOutletIds));

            // Level 4 (Transactions/Ops)
            await db.delete(posSchema.transactions).where(inArray(posSchema.transactions.outletId, currentOutletIds));
            await db.delete(posSchema.stockOpnames).where(inArray(posSchema.stockOpnames.outletId, currentOutletIds));
            await db.delete(posSchema.heldOrders).where(inArray(posSchema.heldOrders.outletId, currentOutletIds));
            await db.delete(posSchema.employeeOutlets).where(inArray(posSchema.employeeOutlets.outletId, currentOutletIds));
            if (productIds.length > 0) {
                await db.delete(posSchema.productVariants).where(inArray(posSchema.productVariants.productId, productIds));
            }

            // Level 3 (Master Data)
            await db.delete(posSchema.products).where(inArray(posSchema.products.outletId, currentOutletIds));
            await db.delete(posSchema.customers).where(inArray(posSchema.customers.outletId, currentOutletIds));
            // Employees might be shared, but if they are linked to these outlets we might want to handle them carefully.

            // Level 2 (Configs)
            await db.delete(posSchema.categories).where(inArray(posSchema.categories.outletId, currentOutletIds));
            await db.delete(posSchema.memberTiers).where(inArray(posSchema.memberTiers.outletId, currentOutletIds));
            await db.delete(posSchema.loyaltySettings).where(inArray(posSchema.loyaltySettings.outletId, currentOutletIds));
            await db.delete(posSchema.paymentMethods).where(inArray(posSchema.paymentMethods.outletId, currentOutletIds));
            await db.delete(posSchema.roles).where(inArray(posSchema.roles.outletId, currentOutletIds));

            // Level 1 (Outlets)
            await db.delete(posSchema.outlets).where(eq(posSchema.outlets.ownerId, session.user.id));
        }

        // 3. Insert data in order
        // Note: Using UUIDs from backup
        if (data.outlets && data.outlets.length > 0) {
            await db.insert(posSchema.outlets).values(data.outlets);
        }

        if (data.categories && data.categories.length > 0) await db.insert(posSchema.categories).values(data.categories);
        if (data.memberTiers && data.memberTiers.length > 0) await db.insert(posSchema.memberTiers).values(data.memberTiers);
        if (data.roles && data.roles.length > 0) await db.insert(posSchema.roles).values(data.roles);
        if (data.paymentMethods && data.paymentMethods.length > 0) await db.insert(posSchema.paymentMethods).values(data.paymentMethods);
        if (data.loyaltySettings && data.loyaltySettings.length > 0) await db.insert(posSchema.loyaltySettings).values(data.loyaltySettings);

        if (data.products && data.products.length > 0) await db.insert(posSchema.products).values(data.products);
        if (data.customers && data.customers.length > 0) await db.insert(posSchema.customers).values(data.customers);
        if (data.employees && data.employees.length > 0) {
            // Handle employees carefully (upsert if they exist but linked to this user's business)
            for (const emp of data.employees) {
                await db.insert(posSchema.employees).values(emp).onConflictDoUpdate({
                    target: posSchema.employees.id,
                    set: emp
                });
            }
        }

        if (data.productVariants && data.productVariants.length > 0) await db.insert(posSchema.productVariants).values(data.productVariants);
        if (data.employeeOutlets && data.employeeOutlets.length > 0) await db.insert(posSchema.employeeOutlets).values(data.employeeOutlets);
        if (data.transactions && data.transactions.length > 0) await db.insert(posSchema.transactions).values(data.transactions);
        if (data.stockOpnames && data.stockOpnames.length > 0) await db.insert(posSchema.stockOpnames).values(data.stockOpnames);
        if (data.heldOrders && data.heldOrders.length > 0) await db.insert(posSchema.heldOrders).values(data.heldOrders);

        if (data.transactionItems && data.transactionItems.length > 0) await db.insert(posSchema.transactionItems).values(data.transactionItems);
        if (data.transactionPayments && data.transactionPayments.length > 0) await db.insert(posSchema.transactionPayments).values(data.transactionPayments);
        if (data.inventoryLogs && data.inventoryLogs.length > 0) await db.insert(posSchema.inventoryLogs).values(data.inventoryLogs);
        if (data.stockOpnameItems && data.stockOpnameItems.length > 0) await db.insert(posSchema.stockOpnameItems).values(data.stockOpnameItems);
        if (data.pointTransactions && data.pointTransactions.length > 0) await db.insert(posSchema.pointTransactions).values(data.pointTransactions);

        await logActivity({
            action: 'RESTORE',
            entityType: 'SETTINGS',
            entityId: session.user.id,
            description: `Melakukan pemulihan data (Restore) dari backup v${version}`,
            metadata: { version, ownerId }
        });

        return NextResponse.json({ success: true, message: "Data berhasil dipulihkan" });

    } catch (error) {
        console.error("Import error:", error);
        return NextResponse.json({ error: "Failed to import/restore data" }, { status: 500 });
    }
}
