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
                className="receipt-container"
                style={{
                    width: "300px",
                    backgroundColor: "white",
                    margin: "0 auto",
                    padding: "20px",
                    color: "black",
                    fontFamily: "'Courier New', Courier, monospace",
                    WebkitFontSmoothing: "antialiased",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
            >
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .receipt-container * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    @media print {
                        @page {
                            margin: 0;
                            size: 80mm auto;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            -webkit-print-color-adjust: exact;
                        }
                        .receipt-container {
                            width: 100% !important;
                            padding: 10px !important;
                            box-shadow: none !important;
                        }
                    }
                    .receipt-header { text-align: center; margin-bottom: 20px; }
                    .receipt-header h1 { font-size: 20px; font-weight: bold; text-transform: uppercase; line-height: 1.2; }
                    .receipt-header p { font-size: 10px; color: #4B5563; margin-top: 5px; line-height: 1.4; }
                    
                    .receipt-divider { border-top: 1px dashed #D1D5DB; margin: 15px 0; }
                    
                    .receipt-info { font-size: 12px; margin-bottom: 15px; }
                    .receipt-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
                    .receipt-val { font-weight: bold; }
                    
                    .receipt-items { margin-bottom: 15px; }
                    .receipt-item { margin-bottom: 10px; }
                    .item-name { font-weight: bold; font-size: 13px; margin-bottom: 2px; }
                    .item-details { display: flex; justify-content: space-between; font-size: 12px; color: #4B5563; }
                    .item-total { color: black; font-weight: 500; }
                    
                    .receipt-totals { font-size: 12px; }
                    .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .grand-total { border-top: 1px dashed #D1D5DB; padding-top: 15px; margin-top: 15px; display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; font-weight: 900; }
                    .grand-total .amount { font-size: 20px; }
                    
                    .payment-info { display: flex; justify-content: space-between; margin-top: 15px; font-size: 12px; }
                    .payment-method { font-weight: bold; text-transform: uppercase; }
                    
                    .receipt-footer { text-align: center; margin-top: 25px; }
                    .receipt-footer .thanks { font-size: 14px; font-weight: bold; }
                    .receipt-footer .powered { font-size: 10px; color: #9CA3AF; margin-top: 5px; }
                `}} />

                {/* Header */}
                <div className="receipt-header">
                    <h1>{outletName || "KATSIRA"}</h1>
                    {outletAddress && <p>{outletAddress}</p>}
                </div>

                <div className="receipt-divider" />

                {/* Invoice Info */}
                <div className="receipt-info">
                    <div className="receipt-row">
                        <span>No:</span>
                        <span className="receipt-val">{invoiceNumber}</span>
                    </div>
                    <div className="receipt-row">
                        <span>Tanggal:</span>
                        <span>{formatDate(date)}</span>
                    </div>
                    {cashierName && (
                        <div className="receipt-row">
                            <span>Kasir:</span>
                            <span>{cashierName}</span>
                        </div>
                    )}
                    {customerName && (
                        <div className="receipt-row">
                            <span>Member:</span>
                            <span>{customerName}</span>
                        </div>
                    )}
                </div>

                <div className="receipt-divider" />

                {/* Items */}
                <div className="receipt-items">
                    {items.map((item, index) => (
                        <div key={index} className="receipt-item">
                            <div className="item-name">{item.productName}</div>
                            <div className="item-details">
                                <span>{item.quantity} x {formatCurrency(item.price)}</span>
                                <span className="item-total">{formatCurrency(item.total)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="receipt-divider" />

                {/* Totals */}
                <div className="receipt-totals">
                    <div className="total-row">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {parseFloat(discount) > 0 && (
                        <div className="total-row" style={{ color: "#10B981", fontWeight: "bold" }}>
                            <span>Diskon:</span>
                            <span>-{formatCurrency(discount)}</span>
                        </div>
                    )}
                    {parseFloat(tax) > 0 && (
                        <div className="total-row" style={{ color: "#4B5563" }}>
                            <span>Pajak:</span>
                            <span>{formatCurrency(tax)}</span>
                        </div>
                    )}

                    <div className="grand-total">
                        <span>TOTAL:</span>
                        <span className="amount">{formatCurrency(totalAmount)}</span>
                    </div>
                </div>

                <div className="payment-info">
                    <span style={{ color: "#6B7280" }}>Bayar:</span>
                    <span className="payment-method">{formatPaymentMethod(paymentMethod)}</span>
                </div>

                <div className="receipt-divider" />

                {/* Footer */}
                <div className="receipt-footer">
                    <p className="thanks">Terima Kasih!</p>
                    <p className="powered">Powered by Katsira</p>
                </div>
            </div>
        );
    }
);

Receipt.displayName = "Receipt";

export default Receipt;
