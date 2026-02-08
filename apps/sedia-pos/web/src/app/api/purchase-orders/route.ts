import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchaseOrders, purchaseOrderItems } from "@/lib/schema/sedia-pos";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get("outletId");

        if (!outletId) {
            return NextResponse.json({ error: "Outlet ID is required" }, { status: 400 });
        }

        const data = await db.query.purchaseOrders.findMany({
            where: eq(purchaseOrders.outletId, outletId),
            orderBy: [desc(purchaseOrders.createdAt)],
            with: {
                supplier: true,
                items: {
                    with: {
                        product: true,
                        variant: true,
                    }
                }
            }
        });

        console.log(`[API PO List] Found ${data.length} POs for outlet ${outletId}`);
        if (data.length > 0) {
            console.log(`[API PO List] First PO ID: ${data[0].id}, Invoice: ${data[0].invoiceNumber}`);
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching purchase orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch purchase orders" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { outletId, supplierId, items, notes, expectedDate } = body;

        // items: { productId: string, variantId?: string, quantity: number, costPrice: number }[]

        if (!outletId || !supplierId || !items || items.length === 0) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Generate invoice number: PO-YYMMXXXX (resets monthly)
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');

        // Count POs in current month for this outlet
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        const count = await db.$count(
            purchaseOrders,
            and(
                eq(purchaseOrders.outletId, outletId),
                gte(purchaseOrders.orderDate, startOfMonth),
                lte(purchaseOrders.orderDate, endOfMonth)
            )
        );

        const sequence = (count + 1).toString().padStart(4, '0'); // XXXX
        const invoiceNumber = `PO-${year}${month}${sequence}`;
        const totalAmount = items.reduce((sum: number, item: any) => sum + ((parseInt(item.quantity) || 0) * (parseInt(item.costPrice) || 0)), 0);

        const [newPO] = await db.insert(purchaseOrders).values({
            outletId,
            supplierId,
            invoiceNumber,
            status: "draft", // Default to draft
            totalAmount,
            orderDate: new Date(),
            expectedDate: expectedDate ? new Date(expectedDate) : null,
            notes,
        }).returning();

        // Insert items
        if (items.length > 0) {
            await db.insert(purchaseOrderItems).values(
                items.map((item: any) => ({
                    purchaseOrderId: newPO.id,
                    productId: item.productId,
                    variantId: item.variantId || null,
                    quantity: parseInt(item.quantity) || 0,
                    costPrice: parseInt(item.costPrice) || 0,
                    subtotal: (parseInt(item.quantity) || 0) * (parseInt(item.costPrice) || 0),
                }))
            );
        }

        return NextResponse.json(newPO, { status: 201 });
    } catch (error) {
        console.error("Error creating purchase order:", error);
        return NextResponse.json(
            { error: "Failed to create purchase order" },
            { status: 500 }
        );
    }
}
