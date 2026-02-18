import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, desc, like } from "drizzle-orm";
import { logActivity } from "@/lib/logging";

// No longer using a static random generator helper
// Logic moved inside POST to query database for sequence

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            outletId,
            customerName,
            items, // Array of { productId, variantId, productName, variantName, quantity, price, total }
            subtotal,
            totalAmount,
            notes
        } = body;

        if (!outletId || !customerName || !items || items.length === 0) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Verify outlet exists
        const [outlet] = await db
            .select()
            .from(posSchema.outlets)
            .where(eq(posSchema.outlets.id, outletId));

        if (!outlet) {
            return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
        }

        // Generate sequential invoice number: WA-YYMMDD-XXXX
        const now = new Date();
        const dateStr = now.getFullYear().toString().slice(-2) +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0');

        const lastTransaction = await db.query.transactions.findFirst({
            where: like(posSchema.transactions.invoiceNumber, `WA-${dateStr}-%`),
            orderBy: desc(posSchema.transactions.invoiceNumber)
        });

        let sequence = 1;
        if (lastTransaction) {
            const parts = lastTransaction.invoiceNumber.split("-");
            const lastSeq = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSeq)) {
                sequence = lastSeq + 1;
            }
        }

        const invoiceNumber = `WA-${dateStr}-${sequence.toString().padStart(4, '0')}`;

        // Start transaction (handled by drizzle if available, but manual here for simplicity)
        // Insert transaction
        const [newTransaction] = await db
            .insert(posSchema.transactions)
            .values({
                outletId,
                invoiceNumber,
                customerId: null, // Public catalog usually doesn't have customerId yet
                cashierId: null,  // No cashier for self-order
                subtotal: String(subtotal),
                discount: "0",
                tax: "0",
                totalAmount: String(totalAmount),
                paymentMethod: "whatsapp",
                paymentStatus: "pending",
                status: "pending", // Mark as pending until confirmed by seller
                notes: notes || `Order by ${customerName}`,
                customerName: customerName,
            })
            .returning();

        // Insert transaction items
        const itemsToInsert = items.map((item: any) => ({
            transactionId: newTransaction.id,
            productId: item.productId || null,
            variantId: item.variantId || null,
            variantName: item.variantName || null,
            productName: item.productName,
            quantity: item.quantity,
            price: String(item.price),
            total: String(item.total),
        }));

        await db.insert(posSchema.transactionItems).values(itemsToInsert);

        // Optionally record point history or customer creation if needed in future
        // For now, focus on recording the sale.

        // Log activity for admin visibility
        await logActivity({
            outletId,
            action: 'CREATE',
            entityType: 'TRANSACTION',
            entityId: newTransaction.id,
            description: `Pesanan WA baru dari ${customerName}: ${invoiceNumber}`,
            metadata: {
                source: 'catalog_whatsapp',
                customerName,
                invoiceNumber,
                totalAmount
            }
        });

        return NextResponse.json(
            {
                ...newTransaction,
                message: "Order recorded successfully"
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating WhatsApp order:", error);
        return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
        );
    }
}
