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

const formatPaymentMethod = (method: string) => {
    if (!method) return "Cash";
    const m = method.toLowerCase();
    if (m === "cash") return "Tunai";
    if (m === "qris" || m === "midtrans_qris") return "QRIS";
    if (m.startsWith("midtrans_va_")) return `Transfer ${m.replace("midtrans_va_", "").toUpperCase()}`;
    if (m === "transfer") return "Transfer";
    return method;
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
        <div ref={ref} className="font-mono text-[11px] leading-tight w-full max-w-[280px] mx-auto p-2 bg-white text-black">
            {/* Header */}
            <div className="text-center mb-4">
                <h1 className="text-base font-bold uppercase tracking-wider">{outletName || "SEDIA POS"}</h1>
                {outletAddress && <p className="text-[10px] mt-1 text-gray-600">{outletAddress}</p>}
                {outletPhone && <p className="text-[10px] text-gray-600">Tel: {outletPhone}</p>}
            </div>

            <div className="border-b border-dashed border-black my-2" />

            {/* Invoice Info */}
            <div className="space-y-0.5 mb-2">
                <div className="flex justify-between">
                    <span>No. Invoice</span>
                    <span className="font-bold">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tanggal</span>
                    <span>{date}</span>
                </div>
                {cashierName && (
                    <div className="flex justify-between">
                        <span>Kasir</span>
                        <span>{cashierName}</span>
                    </div>
                )}
                {customerName && (
                    <div className="flex justify-between">
                        <span>Pelanggan</span>
                        <span className="font-bold">{customerName}</span>
                    </div>
                )}
            </div>

            <div className="border-b border-dashed border-black my-2" />

            {/* Items */}
            <div className="space-y-2 mb-2">
                {items.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                        <div className="font-bold">
                            {item.name}
                            {item.variant && <span className="font-normal text-[10px]"> ({item.variant})</span>}
                        </div>
                        <div className="flex justify-between pl-2">
                            <span>{item.quantity} x {formatCurrency(item.price)}</span>
                            <span>{formatCurrency(item.total)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-b border-dashed border-black my-2" />

            {/* Totals */}
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
                                <span className="uppercase">Bayar ({formatPaymentMethod(pay.method)})</span>
                                <span>{formatCurrency(pay.amount)}</span>
                            </div>
                        ))
                    ) : (
                        <div className="flex justify-between">
                            <span className="uppercase">Bayar ({formatPaymentMethod(paymentMethod || 'Cash')})</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    )}
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
                    <p className="font-bold">Terima Kasih</p>
                    <p className="text-[10px] mt-1">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
                    <p className="mt-2 text-[9px] opacity-60">Powered by SediaPOS</p>
                </div>
            </div>
        </div>
    );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';

