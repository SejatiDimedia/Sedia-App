"use client";

import { useEffect, useState } from "react";
import { ReceiptTemplate } from "@/components/receipts/ReceiptTemplate";
import { useRouter } from "next/navigation";

export default function PrintReceiptPage() {
    const [data, setData] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const storedData = localStorage.getItem("print_receipt_data");
        if (storedData) {
            setData(JSON.parse(storedData));
            // Slight delay to ensure render before print
            setTimeout(() => {
                window.print();
                // Optional: close after print? 
                // window.close(); 
            }, 500);
        } else {
            // No data, redirect back
            // router.push("/pos");
        }
    }, []);

    if (!data) return <div className="flex h-screen items-center justify-center">Loading receipt...</div>;

    const { transaction, outlet, customer } = data;

    return (
        <div className="flex min-h-screen items-start justify-center bg-gray-100 p-8 print:bg-white print:p-0">
            <ReceiptTemplate
                outletName={outlet?.name || "Katsira"}
                outletAddress={outlet?.address}
                outletPhone={outlet?.phone}
                invoiceNumber={transaction.invoiceNumber}
                date={transaction.createdAt || new Date().toLocaleDateString('id-ID')}
                cashierName="Kasir"
                customerName={customer?.name}
                items={transaction.items || []}
                subtotal={transaction.subtotal}
                tax={transaction.tax}
                discount={transaction.discount}
                total={transaction.totalAmount}
                paymentMethod={transaction.paymentMethod}
                paymentDetails={transaction.paymentDetails}
                pointsEarned={transaction.pointsEarned}
            />
            {/* Instruction for non-print view */}
            <div className="fixed bottom-4 left-0 right-0 text-center print:hidden">
                <p className="text-gray-500 text-sm">Jendela pencetakan akan muncul otomatis...</p>
            </div>
        </div>
    );
}
