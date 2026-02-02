"use client";

import { useEffect, useState, use } from "react";
import { ReceiptTemplate } from "@/components/receipts/ReceiptTemplate";
import { Loader2, AlertCircle } from "lucide-react";

interface ReceiptData {
    transaction: any;
    items: any[];
    outlet: any;
    customer: any;
    cashier: any;
}

export default function PublicReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [data, setData] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/receipt/${id}`);
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "Failed to load receipt");
                }
                const result = await res.json();
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-zinc-50 p-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
                <p className="mt-4 text-zinc-500">Memuat struk digital...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-zinc-50 p-4 text-center">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h1 className="mt-4 text-xl font-bold text-zinc-900">Struk Tidak Ditemukan</h1>
                <p className="mt-2 text-zinc-500">{error || "Maaf, struk tidak dapat ditemukan atau telah kedaluwarsa."}</p>
                <a
                    href="/"
                    className="mt-6 rounded-xl bg-primary-600 px-6 py-2 font-medium text-white hover:bg-primary-700"
                >
                    Kembali ke Beranda
                </a>
            </div>
        );
    }

    const { transaction, items, outlet, customer, cashier } = data;

    return (
        <div className="min-h-screen bg-zinc-100 py-8 px-4 sm:px-6">
            <div className="mx-auto max-w-[400px]">
                <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-zinc-200">
                    <div className="bg-primary-600 px-6 py-4 text-center text-white">
                        <h1 className="text-lg font-bold">Struk Digital</h1>
                        <p className="text-xs text-primary-100 opacity-90">Sedia POS - {outlet?.name}</p>
                    </div>

                    <div className="p-6">
                        <ReceiptTemplate
                            outletName={outlet?.name || "Sedia POS"}
                            outletAddress={outlet?.address}
                            outletPhone={outlet?.phone}
                            invoiceNumber={transaction.invoiceNumber}
                            date={new Date(transaction.createdAt).toLocaleString('id-ID', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                            })}
                            cashierName={cashier?.name}
                            customerName={customer?.name}
                            items={items}
                            subtotal={parseFloat(transaction.subtotal || "0")}
                            tax={parseFloat(transaction.tax || "0")}
                            discount={parseFloat(transaction.discount || "0")}
                            total={parseFloat(transaction.totalAmount || "0")}
                            paymentMethod={transaction.paymentMethod}
                            pointsEarned={transaction.pointsEarned}
                        />
                    </div>

                    <div className="border-t border-zinc-100 bg-zinc-50/50 p-6 text-center">
                        <p className="text-xs text-zinc-400">
                            Struk ini adalah bukti pembayaran yang sah.<br />
                            Disimpan secara digital oleh Sedia POS.
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-zinc-400">© 2026 Sedia Ecosystem</p>
                </div>
            </div>
        </div>
    );
}
