"use client";

import { useState, useEffect, useRef } from "react";
import {
    ShoppingCart,
    DollarSign,
    TrendingUp,
    Search,
    Receipt as ReceiptIcon,
    X,
    Printer,
} from "lucide-react";
import Receipt from "@/components/Receipt";

interface Transaction {
    id: string;
    outletId: string;
    invoiceNumber: string;
    customerId: string | null;
    cashierId: string | null;
    subtotal: string;
    discount: string;
    tax: string;
    totalAmount: string;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
    notes: string | null;
    createdAt: string;
}

interface TransactionItem {
    productName: string;
    quantity: number;
    price: string;
    total: string;
}

interface ReceiptData {
    transaction: Transaction;
    items: TransactionItem[];
    outlet: { name: string; address: string | null } | null;
    customer: { name: string } | null;
    cashier: { name: string } | null;
}

interface Outlet {
    id: string;
    name: string;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutletId, setSelectedOutletId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const [loadingReceipt, setLoadingReceipt] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchOutlets();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [selectedOutletId]);

    const fetchOutlets = async () => {
        try {
            const res = await fetch("/api/outlets");
            if (res.ok) {
                const data = await res.json();
                setOutlets(data);
            }
        } catch (error) {
            console.error("Failed to fetch outlets:", error);
        }
    };

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedOutletId) params.set("outletId", selectedOutletId);

            const res = await fetch(`/api/transactions?${params}`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewReceipt = async (transactionId: string) => {
        setLoadingReceipt(true);
        setShowReceiptModal(true);
        try {
            const res = await fetch(`/api/transactions/${transactionId}/receipt`);
            if (res.ok) {
                const data = await res.json();
                setReceiptData(data);
            }
        } catch (error) {
            console.error("Failed to fetch receipt:", error);
        } finally {
            setLoadingReceipt(false);
        }
    };

    const handlePrint = () => {
        if (receiptRef.current) {
            const printContents = receiptRef.current.innerHTML;
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>Receipt - ${receiptData?.transaction.invoiceNumber}</title>
                        <style>
                            body { font-family: monospace; margin: 0; padding: 20px; }
                            * { box-sizing: border-box; }
                        </style>
                    </head>
                    <body>${printContents}</body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

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

    const filteredTransactions = transactions.filter(
        (t) =>
            t.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate today's total
    const today = new Date().toDateString();
    const todayTransactions = transactions.filter(
        (t) => new Date(t.createdAt).toDateString() === today
    );
    const todayTotal = todayTransactions.reduce(
        (sum, t) => sum + parseFloat(t.totalAmount || "0"),
        0
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        Transaksi
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Riwayat semua transaksi penjualan
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-500">Hari Ini</span>
                        <DollarSign className="h-5 w-5 text-primary-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-zinc-900">
                        {formatCurrency(todayTotal)}
                    </p>
                    <p className="text-xs text-zinc-500">
                        {todayTransactions.length} transaksi
                    </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-500">Total</span>
                        <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-zinc-900">
                        {transactions.length}
                    </p>
                    <p className="text-xs text-zinc-500">transaksi tercatat</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <select
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none"
                >
                    <option value="">Semua Outlet</option>
                    {outlets.map((outlet) => (
                        <option key={outlet.id} value={outlet.id}>
                            {outlet.name}
                        </option>
                    ))}
                </select>

                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Cari invoice..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>
            </div>

            {/* Transactions List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                </div>
            ) : filteredTransactions.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
                    <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
                    <h3 className="text-lg font-medium text-zinc-900">
                        Belum Ada Transaksi
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">
                        Mulai transaksi pertama Anda dengan membuka halaman Kasir
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-200 bg-zinc-50">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Invoice
                                </th>
                                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 sm:table-cell">
                                    Tanggal
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Pembayaran
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Pajak
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Total
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {filteredTransactions.map((transaction) => (
                                <tr
                                    key={transaction.id}
                                    className="transition-colors hover:bg-zinc-50"
                                >
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-zinc-900">
                                            {transaction.invoiceNumber}
                                        </span>
                                    </td>
                                    <td className="hidden px-4 py-3 text-sm text-zinc-500 sm:table-cell">
                                        {formatDate(transaction.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium uppercase text-green-700">
                                            {transaction.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-zinc-500">
                                        {formatCurrency(transaction.tax || "0")}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-zinc-900">
                                        {formatCurrency(transaction.totalAmount)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleViewReceipt(transaction.id)}
                                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
                                            title="Lihat Struk"
                                        >
                                            <ReceiptIcon className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceiptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="relative max-h-[90vh] w-full max-w-md overflow-auto rounded-xl bg-zinc-100 shadow-xl">
                        {/* Modal Header */}
                        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white p-4">
                            <h2 className="text-lg font-bold text-zinc-900">Struk</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrint}
                                    disabled={loadingReceipt}
                                    className="rounded-lg bg-primary-500 p-2 text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
                                    title="Print"
                                >
                                    <Printer className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        setShowReceiptModal(false);
                                        setReceiptData(null);
                                    }}
                                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Receipt Content */}
                        <div className="p-4">
                            {loadingReceipt ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                                </div>
                            ) : receiptData ? (
                                <Receipt
                                    ref={receiptRef}
                                    invoiceNumber={receiptData.transaction.invoiceNumber}
                                    date={receiptData.transaction.createdAt}
                                    outletName={receiptData.outlet?.name || "Sedia POS"}
                                    outletAddress={receiptData.outlet?.address || undefined}
                                    cashierName={receiptData.cashier?.name}
                                    customerName={receiptData.customer?.name}
                                    items={receiptData.items}
                                    subtotal={receiptData.transaction.subtotal}
                                    discount={receiptData.transaction.discount}
                                    tax={receiptData.transaction.tax}
                                    totalAmount={receiptData.transaction.totalAmount}
                                    paymentMethod={receiptData.transaction.paymentMethod}
                                />
                            ) : (
                                <p className="text-center text-zinc-500">
                                    Gagal memuat struk
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
