import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/transactions/hold - List held transactions
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

        if (!outletId) {
            return NextResponse.json({ error: "Outlet ID is required" }, { status: 400 });
        }

        const heldTransactions = await db
            .select()
            .from(posSchema.transactions)
            .where(
                and(
                    eq(posSchema.transactions.outletId, outletId),
                    eq(posSchema.transactions.status, "hold")
                )
            )
            .orderBy(desc(posSchema.transactions.createdAt));

        return NextResponse.json(heldTransactions);
    } catch (error) {
        console.error("Error fetching held transactions:", error);
        return NextResponse.json(
            { error: "Failed to fetch held transactions" },
            { status: 500 }
        );
    }
}

// POST /api/transactions/hold - Create held transaction
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { outletId, items, customerId, notes } = body;

        // Create transaction with status 'hold'
        // Using existing transactions table but with status='hold'
        // Invoice number format: HOLD-[TIMESTAMP]
        const invoiceNumber = `HOLD-${Date.now()}`;

        // Calculate totals
        let subtotal = 0;
        const transactionItemsData = items.map((item: any) => {
            const total = Number(item.price) * item.quantity;
            subtotal += total;
            return {
                ...item,
                total: String(total)
            };
        });

        const [newTransaction] = await db
            .insert(posSchema.transactions)
            .values({
                outletId,
                invoiceNumber,
                customerId: customerId || null,
                cashierId: session.user.id,
                subtotal: String(subtotal),
                totalAmount: String(subtotal),
                paymentMethod: "hold",
                paymentStatus: "unpaid",
                status: "hold",
                notes
            })
            .returning();

        // Insert items
        if (transactionItemsData.length > 0) {
            await db.insert(posSchema.transactionItems).values(
                transactionItemsData.map((item: any) => ({
                    transactionId: newTransaction.id,
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    price: String(item.price),
                    total: item.total
                }))
            );
        }

        return NextResponse.json(newTransaction, { status: 201 });
    } catch (error) {
        console.error("Error creating held transaction:", error);
        return NextResponse.json(
            { error: "Failed to create held transaction" },
            { status: 500 }
        );
    }
}
