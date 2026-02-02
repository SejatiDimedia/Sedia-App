import { NextRequest, NextResponse } from "next/server";
import { checkTransactionStatus } from "@/lib/payment/midtrans";

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
    try {
        const { orderId } = await params;

        if (!orderId) {
            return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
        }

        const statusResponse = await checkTransactionStatus(orderId);

        return NextResponse.json(statusResponse);

    } catch (error: any) {
        console.error("Payment Status API Error:", error);
        return NextResponse.json({
            error: "Failed to check status",
            details: error.message
        }, { status: 500 });
    }
}
