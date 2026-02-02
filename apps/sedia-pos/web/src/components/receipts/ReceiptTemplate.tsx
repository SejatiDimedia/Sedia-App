import React, { forwardRef } from 'react';
import { ExternalLink } from 'lucide-react';

interface ReceiptProps {
    outletName: string;
    outletAddress?: string;
    outletPhone?: string;
    invoiceNumber: string;
    date: string;
    cashierName?: string;
    customerName?: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
        total: number;
        variant?: string;
    }>;
    subtotal: number;
    tax: number;
    taxName?: string;
    discount: number;
    total: number;
    paymentMethod?: string; // Legacy support
    paymentDetails?: Array<{
        method: string;
        amount: number;
    }>;
    pointsEarned?: number;
    pointsRedeemed?: number;
}

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptProps>((props, ref) => {
    const {
        outletName,
        outletAddress,
        outletPhone,
        invoiceNumber,
        date,
        cashierName,
        customerName,
        items,
        subtotal,
        tax,
        taxName,
        discount,
        total,
        paymentMethod,
        paymentDetails,
        pointsEarned,
    } = props;

    return (
        // ... (Header, Info, Items remain same)
        // ... (skipping to Totals section)

        <div className="space-y-1">
            <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
                <div className="flex justify-between">
                    <span>Diskon</span>
                    <span>-{formatCurrency(discount)}</span>
                </div>
            )}
            {tax > 0 && (
                <div className="flex justify-between">
                    <span>{taxName || "Pajak"}</span>
                    <span>{formatCurrency(tax)}</span>
                </div>
            )}
            <div className="flex justify-between font-bold text-sm mt-2">
                <span>TOTAL</span>
                <span>{formatCurrency(total)}</span>
            </div>

            {/* Payment Details Breakdown */}
            <div className="mt-2 border-t border-dashed border-black pt-2 space-y-1">
                {paymentDetails && paymentDetails.length > 0 ? (
                    paymentDetails.map((pay, idx) => (
                        <div key={idx} className="flex justify-between text-[10px]">
                            <span className="uppercase">Bayar ({pay.method})</span>
                            <span>{formatCurrency(pay.amount)}</span>
                        </div>
                    ))
                ) : (
                    <div className="flex justify-between">
                        <span className="uppercase">Bayar ({paymentMethod || 'Cash'})</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                )}

                {/* Change/Kembalian Logic could be added here if we had 'paidAmount' */}
            </div>
            {/* Points */}
            {pointsEarned && pointsEarned > 0 && (
                <>
                    <div className="border-b border-dashed border-black my-2" />
                    <div className="text-center">
                        <span className="font-bold">Poin Diterima: {pointsEarned}</span>
                    </div>
                </>
            )}

            <div className="border-b border-dashed border-black my-2" />

            {/* Footer */}
            <div className="text-center mt-4">
                <p>Terima Kasih</p>
                <p className="mt-1">Powered by SediaPOS</p>
            </div>
        </div>
    );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';
