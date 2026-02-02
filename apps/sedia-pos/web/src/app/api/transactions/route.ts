import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { logActivity } from "@/lib/logging";

// GET /api/transactions - Fetch all transactions
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get("outletId");

        let query;
        if (outletId) {
            query = db
                .select()
                .from(posSchema.transactions)
                .where(eq(posSchema.transactions.outletId, outletId))
                .orderBy(desc(posSchema.transactions.createdAt));
        } else {
            query = db
                .select()
                .from(posSchema.transactions)
                .orderBy(desc(posSchema.transactions.createdAt));
        }

        const transactions = await query;

        return NextResponse.json(transactions, {
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}

// POST /api/transactions - Create new transaction from Mobile POS
export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            outletId,
            invoiceNumber,
            customerId,
            cashierId,
            subtotal,
            discount,
            tax,
            totalAmount,
            paymentMethod,
            paymentStatus,
            status,
            notes,
            items,
            payments, // Array of { paymentMethod, amount, referenceNumber }
        } = body;

        if (!outletId || !invoiceNumber || totalAmount === undefined || !paymentMethod) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate stock for all items BEFORE creating transaction
        if (items && Array.isArray(items) && items.length > 0) {
            const stockErrors: string[] = [];

            for (const item of items) {
                if (item.productId) {
                    const [product] = await db
                        .select()
                        .from(posSchema.products)
                        .where(eq(posSchema.products.id, item.productId));

                    if (!product) {
                        stockErrors.push(`Produk "${item.productName}" tidak ditemukan`);
                    } else if (product.trackStock && product.stock < item.quantity) {
                        stockErrors.push(`Stok "${item.productName}" tidak cukup (tersedia: ${product.stock}, diminta: ${item.quantity})`);
                    }
                }
            }

            if (stockErrors.length > 0) {
                return NextResponse.json(
                    { error: "Stok tidak mencukupi", details: stockErrors },
                    { status: 400 }
                );
            }
        }

        // Insert transaction
        const [newTransaction] = await db
            .insert(posSchema.transactions)
            .values({
                outletId,
                invoiceNumber,
                customerId: customerId || null,
                cashierId: cashierId || null,
                subtotal: String(subtotal),
                discount: String(discount || 0),
                tax: String(tax || 0),
                totalAmount: String(totalAmount),
                paymentMethod: payments && payments.length > 1 ? "Split" : (payments?.[0]?.paymentMethod || paymentMethod),
                paymentStatus: paymentStatus || "paid",
                status: status || "completed",
                notes: notes || null,
            })
            .returning();

        // Insert transaction payments
        if (payments && Array.isArray(payments) && payments.length > 0) {
            const paymentsToInsert = payments.map((p: any) => ({
                transactionId: newTransaction.id,
                paymentMethod: p.paymentMethod,
                amount: String(p.amount),
                referenceNumber: p.referenceNumber || null,
            }));
            await db.insert(posSchema.transactionPayments).values(paymentsToInsert);
        } else {
            // Fallback: Create a single payment entry from main paymentMethod
            await db.insert(posSchema.transactionPayments).values({
                transactionId: newTransaction.id,
                paymentMethod: paymentMethod,
                amount: String(totalAmount),
            });
        }

        // Insert transaction items if provided
        if (items && Array.isArray(items) && items.length > 0) {
            const itemsToInsert = items.map((item: {
                productId?: string;
                productName: string;
                productSku?: string;
                quantity: number;
                price: number;
                costPrice?: number;
                discount?: number;
                total: number;
            }) => ({
                transactionId: newTransaction.id,
                productId: item.productId || null,
                productName: item.productName,
                productSku: item.productSku || null,
                quantity: item.quantity,
                price: String(item.price),
                costPrice: item.costPrice ? String(item.costPrice) : null,
                discount: String(item.discount || 0),
                total: String(item.total),
            }));

            await db.insert(posSchema.transactionItems).values(itemsToInsert);

            // Decrease product stock for each item
            for (const item of items) {
                if (item.productId) {
                    const [product] = await db
                        .select()
                        .from(posSchema.products)
                        .where(eq(posSchema.products.id, item.productId));

                    if (product && product.trackStock) {
                        const newStock = Math.max(0, product.stock - item.quantity);
                        await db
                            .update(posSchema.products)
                            .set({ stock: newStock })
                            .where(eq(posSchema.products.id, item.productId));
                    }
                }
            }
        }

        // Award loyalty points to customer based on outlet settings
        let earnedPoints = 0;
        if (customerId) {
            // Get loyalty settings for this outlet
            const [loyaltySettings] = await db
                .select()
                .from(posSchema.loyaltySettings)
                .where(eq(posSchema.loyaltySettings.outletId, outletId));

            // Default: 1 point per Rp 1,000 if no settings
            const amountPerPoint = loyaltySettings?.amountPerPoint ?? 1000;
            const pointsPerAmount = loyaltySettings?.pointsPerAmount ?? 1;
            const isLoyaltyEnabled = loyaltySettings?.isEnabled ?? true;

            if (isLoyaltyEnabled && amountPerPoint > 0) {
                earnedPoints = Math.floor(totalAmount / amountPerPoint) * pointsPerAmount;
            }

            const [customer] = await db
                .select()
                .from(posSchema.customers)
                .where(eq(posSchema.customers.id, customerId));

            if (customer && earnedPoints > 0) {
                const newPoints = (customer.points || 0) + earnedPoints;
                const newTotalSpent = parseFloat(customer.totalSpent || "0") + totalAmount;

                // Update customer points
                await db
                    .update(posSchema.customers)
                    .set({
                        points: newPoints,
                        totalSpent: String(newTotalSpent),
                    })
                    .where(eq(posSchema.customers.id, customerId));

                // Record point transaction history
                await db.insert(posSchema.pointTransactions).values({
                    customerId,
                    outletId,
                    transactionId: newTransaction.id,
                    type: "earn",
                    points: earnedPoints,
                    description: `Poin dari transaksi ${invoiceNumber}`,
                });

                // Auto Tier Upgrade Check
                const allTiers = await db
                    .select()
                    .from(posSchema.memberTiers)
                    .where(eq(posSchema.memberTiers.outletId, outletId))
                    .orderBy(desc(posSchema.memberTiers.minPoints));

                if (allTiers.length > 0) {
                    // Find the highest tier the customer qualifies for
                    const qualifiedTier = allTiers.find(t => newPoints >= t.minPoints);
                    if (qualifiedTier && qualifiedTier.id !== customer.tierId) {
                        await db
                            .update(posSchema.customers)
                            .set({ tierId: qualifiedTier.id })
                            .where(eq(posSchema.customers.id, customerId));
                    }
                }
            }
        }

        // Log transaction
        await logActivity({
            outletId,
            action: 'CREATE',
            entityType: 'TRANSACTION',
            entityId: newTransaction.id,
            description: `Transaksi baru: ${newTransaction.invoiceNumber}`,
            metadata: {
                transactionId: newTransaction.id,
                invoiceNumber: newTransaction.invoiceNumber,
                totalAmount: newTransaction.totalAmount,
                earnedPoints
            }
        });

        return NextResponse.json(
            {
                ...newTransaction,
                earnedPoints,
                message: "Transaction saved successfully"
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating transaction:", error);
        return NextResponse.json(
            { error: "Failed to create transaction" },
            { status: 500 }
        );
    }
}


