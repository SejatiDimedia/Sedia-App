"use client";

import { useEffect, useState } from "react";
import { ReceiptTemplate } from "@/components/receipts/ReceiptTemplate";

export default function PrintReceiptPage() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const storedData = localStorage.getItem("print_receipt_data");
        if (storedData) {
            setData(JSON.parse(storedData));
            // Automatically trigger print after a short delay to ensure rendering
            setTimeout(() => {
                window.print();
                // Close window after printing (optional, but good for UX)
                // window.close(); 
            }, 500);
        }
    }, []);

    if (!data) return (
        <div className="p-4 text-center text-zinc-500">
            Menyiapkan dokumen pencetakan...
        </div>
    );

    return (
        <div className="p-4 bg-white" style={{ width: '80mm', margin: '0 auto' }}>
            <ReceiptTemplate
                outletName={data.outletName}
                outletAddress={data.outletAddress}
                outletPhone={data.outletPhone}
                invoiceNumber={data.invoiceNumber || data.id}
                date={data.createdAt}
                items={data.items}
                subtotal={data.subtotal}
                tax={data.tax}
                discount={data.discount}
                total={data.totalAmount || data.total}
                paymentMethod={data.paymentMethod}
                cashierName={data.cashierName}
                customerName={data.customer?.name || data.customerName}
                pointsEarned={data.pointsEarned}
            />

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: 80mm auto;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    nav, footer, .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
