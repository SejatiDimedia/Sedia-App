"use client";

import { forwardRef } from "react";

interface ReceiptItem {
    productName: string;
    quantity: number;
    price: string;
    total: string;
}

interface ReceiptProps {
    invoiceNumber: string;
    date: string;
    outletName: string;
    outletAddress?: string;
    cashierName?: string;
    customerName?: string;
    items: ReceiptItem[];
    subtotal: string;
    discount: string;
    tax: string;
    totalAmount: string;
    paymentMethod: string;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
    (
        {
            invoiceNumber,
            date,
            outletName,
            outletAddress,
            cashierName,
            customerName,
            items,
            subtotal,
            discount,
            tax,
            totalAmount,
            paymentMethod,
        },
        ref
    ) => {
        const formatCurrency = (value: string | number) => {
            return new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
            }).format(parseFloat(String(value)) || 0);
        };

        const formatDate = (dateStr: string) => {
            return new Date(dateStr).toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        };

        const formatPaymentMethod = (method: string) => {
            if (!method) return "-";
            const m = method.toLowerCase();
            if (m === "cash") return "Tunai";
            if (m === "qris" || m === "midtrans_qris") return "QRIS";
            if (m.startsWith("midtrans_va_")) return `Transfer ${m.replace("midtrans_va_", "").toUpperCase()}`;
            if (m === "transfer") return "Transfer";
            return method;
        };

        return (
            <div
                ref={ref}
                className="mx-auto w-[300px] bg-white p-4 font-mono text-xs text-black"
                style={{ fontFamily: "monospace" }}
            >
                {/* Header */}
                <div className="mb-4 text-center">
                    <h1 className="text-lg font-bold uppercase">{outletName || "KATSIRA"}</h1>
                    {outletAddress && (
                        <p className="text-[10px] text-gray-600 mt-1">{outletAddress}</p>
                    )}
                </div>

                <div className="mb-3 border-t border-dashed border-gray-400" />

                {/* Invoice Info */}
                <div className="mb-3 space-y-1">
                    <div className="flex justify-between">
                        <span>No:</span>
                        <span className="font-semibold">{invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tanggal:</span>
                        <span>{formatDate(date)}</span>
                    </div>
                    {cashierName && (
                        <div className="flex justify-between">
                            <span>Kasir:</span>
                            <span>{cashierName}</span>
                        </div>
                    )}
                    {customerName && (
                        <div className="flex justify-between">
                            <span>Member:</span>
                            <span>{customerName}</span>
                        </div>
                    )}
                </div>

                <div className="mb-3 border-t border-dashed border-gray-400" />

                {/* Items */}
                <div className="mb-3 space-y-2">
                    {items.map((item, index) => (
                        <div key={index}>
                            <div className="font-semibold">{item.productName}</div>
                            <div className="flex justify-between text-gray-600">
                                <span>
                                    {item.quantity} x {formatCurrency(item.price)}
                                </span>
                                <span>{formatCurrency(item.total)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mb-3 border-t border-dashed border-gray-400" />

                {/* Totals */}
                <div className="mb-3 space-y-1">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {parseFloat(discount) > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Diskon:</span>
                            <span>-{formatCurrency(discount)}</span>
                        </div>
                    )}
                    {parseFloat(tax) > 0 && (
                        <div className="flex justify-between">
                            <span>Pajak:</span>
                            <span>{formatCurrency(tax)}</span>
                        </div>
                    )}
                </div>

                <div className="mb-3 border-t border-dashed border-gray-400" />

                {/* Grand Total */}
                <div className="mb-3 flex justify-between text-base font-bold">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                </div>

                <div className="flex justify-between">
                    <span>Bayar:</span>
                    <span className="uppercase">{formatPaymentMethod(paymentMethod)}</span>
                </div>

                <div className="my-4 border-t border-dashed border-gray-400" />

                {/* Footer */}
                <div className="text-center">
                    <p className="font-semibold">Terima Kasih!</p>
                    <p className="mt-1 text-[10px] text-gray-500">
                        Powered by Katsira
                    </p>
                </div>
            </div>
        );
    }
);

Receipt.displayName = "Receipt";

export default Receipt;
