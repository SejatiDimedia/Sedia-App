import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { logActivity } from "@/lib/logging";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/transactions - Fetch all transactions
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const outletIdParam = searchParams.get("outletId");

        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
            return NextResponse.json([]); // No access to any transactions
        }

        // 2. Build Query
        let query;

        // If specific outlet requested, verify access
        if (outletIdParam) {
            if (!allowedOutletIds.includes(outletIdParam)) {
                return NextResponse.json({ error: "Forbidden: No access to this outlet" }, { status: 403 });
            }
            query = db
                .select()
                .from(posSchema.transactions)
                .where(eq(posSchema.transactions.outletId, outletIdParam))
                .orderBy(desc(posSchema.transactions.createdAt));
        } else {
            // Filter by ALL allowed outlets
            query = db
                .select()
                .from(posSchema.transactions)
                .where(inArray(posSchema.transactions.outletId, allowedOutletIds))
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
                    if (item.variantId) {
                        const [variant] = await db
                            .select()
                            .from(posSchema.productVariants)
                            .where(eq(posSchema.productVariants.id, item.variantId));

                        if (!variant) {
                            // SKIP IF VARIANT NOT FOUND - Maybe it was deleted or sync issue
                            // stockErrors.push(`Varian "${item.variantName || item.productName}" tidak ditemukan`);
                            console.warn(`Transaction includes unknown variant ID: ${item.variantId}`);
                        } else if (variant.stock !== null && (variant.stock) < item.quantity) {
                            // Only check stock if not null? Actually schema has default 0.
                            // Let's assume strict stock check for now, but maybe the issue is sync.
                            stockErrors.push(`Stok varian "${item.variantName || item.productName}" tidak cukup (tersedia: ${variant.stock ?? 0}, diminta: ${item.quantity})`);
                        }
                    } else {
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
                variantId?: string;
                variantName?: string;
            }) => ({
                transactionId: newTransaction.id,
                productId: item.productId || null,
                variantId: item.variantId || null,
                variantName: item.variantName || null,
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
                    if (item.variantId) {
                        const [variant] = await db
                            .select()
                            .from(posSchema.productVariants)
                            .where(eq(posSchema.productVariants.id, item.variantId));

                        if (variant) {
                            const newStock = Math.max(0, (variant.stock || 0) - item.quantity);
                            await db
                                .update(posSchema.productVariants)
                                .set({ stock: newStock })
                                .where(eq(posSchema.productVariants.id, item.variantId));
                        }
                    } else {
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


