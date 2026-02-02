import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const methods = await db
            .select()
            .from(posSchema.paymentMethods)
            .where(and(
                eq(posSchema.paymentMethods.outletId, id),
                eq(posSchema.paymentMethods.isActive, true)
            ));

        // If no custom methods found, return default ones
        if (methods.length === 0) {
            return NextResponse.json([
                { id: 'cash', name: 'Tunai', type: 'cash', isActive: true },
                { id: 'qris', name: 'QRIS', type: 'qris', isActive: true },
                { id: 'transfer', name: 'Transfer Bank', type: 'transfer', isActive: true },
            ]);
        }

        return NextResponse.json(methods);
    } catch (error) {
        console.error("Error fetching payment methods:", error);
        return NextResponse.json(
            { error: "Failed to fetch payment methods" },
            { status: 500 }
        );
    }
}
