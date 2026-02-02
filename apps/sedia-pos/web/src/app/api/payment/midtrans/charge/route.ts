import { NextRequest, NextResponse } from "next/server";
import { createTransaction } from "@/lib/payment/midtrans";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        let { orderId, amount, paymentType = 'qris', bank } = body;

        console.log("PAYLOAD RECEIVED:", { orderId, amount, paymentType, bank });

        if (!orderId || !amount) {
            return NextResponse.json({ error: "Missing orderId or amount" }, { status: 400 });
        }

        // Ensure amount is integer
        amount = Math.round(Number(amount));

        // Fallback for bank
        if (paymentType === 'bank_transfer' && !bank) {
            console.warn("Missing bank for bank_transfer, defaulting to bca");
            bank = 'bca';
        }

        const transaction = await createTransaction(orderId, amount, paymentType, bank);

        console.log("MIDTRANS RESPONSE:", JSON.stringify(transaction, null, 2));

        return NextResponse.json(transaction);

    } catch (error: any) {
        console.error("Payment API Error:", error);
        return NextResponse.json({
            error: "Payment creation failed",
            details: error.message
        }, { status: 500 });
    }
}
