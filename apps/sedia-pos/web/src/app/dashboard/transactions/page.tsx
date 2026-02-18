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
    MessageCircle,
    Check,
    Trash2,
    Download,
    Share2,
    Loader2,
} from "lucide-react";
import { toPng } from "html-to-image";
import Receipt from "@/components/Receipt";
import { toast } from "react-hot-toast";

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
    customerName: string | null;
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
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]); // Store payment methods
    const [selectedOutletId, setSelectedOutletId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const [loadingReceipt, setLoadingReceipt] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "whatsapp">("all");

    // Custom Confirm Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        actionType: 'approve' | 'reject' | 'delete';
        transactionId: string;
        invoice?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        actionType: 'approve',
        transactionId: '',
    });

    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchOutlets();
        fetchPaymentMethods();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [selectedOutletId]);

    const fetchPaymentMethods = async () => {
        try {
            // Fetch all payment methods generic or per outlet. 
            // For now, let's try to fetch a broad list or just from the first available outlet if needed.
            // Since ID is unique, we can try fetching from a known endpoint if available, 
            // or we will just have to rely on fetching when an outlet is selected.
            // Let's assume we can fetch global methods or just fetch when outlet selected.
            // Actually, fetching /api/outlets/{id}/payment-methods is best.
            // Let's just create a lookup when we have transactions.
        } catch (e) {
            console.error(e);
        }
    };

    // Better approach: fetch payment methods when selectedOutletId changes, or match with what we have.
    // If no outlet selected, we might miss some names if they are outlet-specific.
    // But usually IDs are UUIDs. 

    // Let's do: Fetch IDs when loading transactions?
    // Let's Modify fetchTransactions to also fetch payment methods for the filtered outlet(s).

    const fetchOutlets = async () => {
        try {
            const res = await fetch("/api/outlets");
            if (res.ok) {
                const data = await res.json();
                setOutlets(data);
                // Pre-fetch payment methods for the first outlet or all if possible?
                // Let's iterate and fetch? No that's too heavy.
                // Let's just check the transactions.
            }
        } catch (error) {
            console.error("Failed to fetch outlets:", error);
        }
    };

    // Helper to fetch methods for an outlet
    const loadPaymentMethods = async (id: string) => {
        try {
            const res = await fetch(`/api/outlets/${id}/payment-methods`);
            if (res.ok) {
                const data = await res.json();
                setPaymentMethods(prev => [...prev, ...data]);
            }
        } catch (e) { }
    };

    useEffect(() => {
        if (selectedOutletId) loadPaymentMethods(selectedOutletId);
        else if (outlets.length > 0) {
            // Try loading for first few outlets to populate cache
            outlets.slice(0, 3).forEach(o => loadPaymentMethods(o.id));
        }
    }, [selectedOutletId, outlets]);

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

    const handleConfirmAction = async () => {
        const { actionType, transactionId, invoice } = confirmModal;
        setConfirmModal(prev => ({ ...prev, isOpen: false }));

        // Set loading state for the specific transaction
        const setLoadingState = (id: string | null) => {
            setTransactions(prev => prev.map(t =>
                t.id === transactionId ? { ...t, _isProcessing: id } : t
            ));
        };

        setLoadingState(transactionId); // Indicate processing for this transaction

        try {
            let res;
            if (actionType === 'approve') {
                res = await fetch(`/api/transactions/${transactionId}/approve`, {
                    method: "POST"
                });
                if (res.ok) {
                    toast.success("Pesanan berhasil disetujui!");
                    fetchTransactions();
                } else {
                    const data = await res.json();
                    toast.error(data.error || "Gagal menyetujui pesanan");
                }
            } else if (actionType === 'reject') {
                res = await fetch(`/api/transactions/${transactionId}/reject`, {
                    method: "POST"
                });
                if (res.ok) {
                    toast.success("Pesanan berhasil ditolak.");
                    fetchTransactions();
                } else {
                    const data = await res.json();
                    toast.error(data.error || "Gagal menolak pesanan");
                }
            } else if (actionType === 'delete') {
                res = await fetch(`/api/transactions/${transactionId}`, {
                    method: "DELETE"
                });
                if (res.ok) {
                    toast.success("Data berhasil dihapus.");
                    fetchTransactions();
                } else {
                    const data = await res.json();
                    toast.error(data.error || "Gagal menghapus data");
                }
            }
        } catch (error) {
            console.error(`Failed to ${actionType} order:`, error);
            toast.error("Terjadi kesalahan teknis");
        } finally {
            setLoadingState(null); // Clear processing state
        }
    };

    const triggerAction = (type: 'approve' | 'reject' | 'delete', id: string, inv?: string) => {
        let title = '';
        let message = '';

        if (type === 'approve') {
            title = 'Setujui Pesanan';
            message = 'Yakin ingin menyetujui pesanan ini? Stok produk akan dikurangi secara otomatis.';
        } else if (type === 'reject') {
            title = 'Tolak Pesanan';
            message = 'Yakin ingin menolak pesanan ini? Status akan berubah menjadi Dibatalkan.';
        } else if (type === 'delete') {
            title = 'Hapus Transaksi';
            message = `Yakin ingin menghapus permanen pesanan ${inv}? Tindakan ini tidak dapat dibatalkan.`;
        }

        setConfirmModal({
            isOpen: true,
            title,
            message,
            actionType: type,
            transactionId: id,
            invoice: inv
        });
    };

    const handlePrint = () => {
        if (receiptRef.current) {
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                const styles = Array.from(document.styleSheets)
                    .map(styleSheet => {
                        try {
                            return Array.from(styleSheet.cssRules)
                                .map(rule => rule.cssText)
                                .join("");
                        } catch (e) {
                            return "";
                        }
                    })
                    .join("");

                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Print Receipt</title>
                            <style>
                                ${styles}
                                body { margin: 0; padding: 0; background: white; }
                                .receipt-container { box-shadow: none !important; margin: 0 !important; width: 100% !important; }
                            </style>
                        </head>
                        <body>
                            ${receiptRef.current.outerHTML}
                            <script>
                                window.onload = () => {
                                    setTimeout(() => {
                                        window.print();
                                        window.close();
                                    }, 500);
                                };
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
        }
    };

    const handleDownloadReceipt = async () => {
        if (!receiptRef.current || !receiptData) return;

        try {
            // Optimization: Remove shadow and ensure fixed width for capture
            const element = receiptRef.current;
            const originalShadow = element.style.boxShadow;
            element.style.boxShadow = 'none';

            const dataUrl = await toPng(element, {
                cacheBust: true,
                backgroundColor: "#ffffff",
                pixelRatio: 1.5, // Reduced from 2 to prevent "too big" feeling while maintaining quality
                width: 300,
                style: {
                    margin: '0',
                }
            });

            element.style.boxShadow = originalShadow;

            const link = document.createElement("a");
            link.download = `struk-${receiptData.transaction.invoiceNumber}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Failed to download receipt:", error);
            alert("Gagal mengunduh struk");
        }
    };

    const handleShareReceipt = async () => {
        if (!receiptRef.current || !receiptData) return;

        try {
            const dataUrl = await toPng(receiptRef.current, {
                cacheBust: true,
                backgroundColor: "#ffffff",
                pixelRatio: 2,
            });

            // Convert dataUrl to File
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `struk-${receiptData.transaction.invoiceNumber}.png`, { type: "image/png" });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Struk ${receiptData.transaction.invoiceNumber}`,
                    text: `Berikut adalah struk belanja dari ${receiptData.outlet?.name || 'Katsira'}`,
                });
            } else {
                // Fallback for desktop: download
                const link = document.createElement("a");
                link.download = `struk-${receiptData.transaction.invoiceNumber}.png`;
                link.href = dataUrl;
                link.click();
                alert("Struk diunduh (Pilih bagikan manual jika Share API tidak didukung)");
            }
        } catch (error) {
            console.error("Failed to share receipt:", error);
            alert("Gagal membagikan struk");
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

    const formatPaymentMethod = (method: string) => {
        if (!method) return "-";

        // Check for exact ID match in loaded payment methods
        const found = paymentMethods.find(pm => pm.id === method);
        if (found) return found.name;

        if (method === "whatsapp") return "WhatsApp";
        if (method === "cash") return "Tunai";
        if (method === "qris" || method === "midtrans_qris") return "QRIS";
        if (method.startsWith("midtrans_va_")) return `Transfer ${method.replace("midtrans_va_", "").toUpperCase()}`;
        if (method === "transfer") return "Transfer";

        return method;
    };

    const filteredTransactions = transactions.filter(
        (t) => {
            const matchesSearch = t.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                formatPaymentMethod(t.paymentMethod).toLowerCase().includes(searchQuery.toLowerCase());

            const matchesTab = activeTab === "all" || t.paymentMethod === "whatsapp";

            return matchesSearch && matchesTab;
        }
    );

    // Calculate today's total
    const today = new Date().toDateString();
    const todayTransactions = transactions.filter(
        (t) => new Date(t.createdAt).toDateString() === today
    );
    const todayTotal = todayTransactions.reduce(
        (sum, t) => sum + (t.status === 'completed' ? parseFloat(t.totalAmount || "0") : 0),
        0
    );

    // Calculate all time total
    const allTimeTotal = transactions.reduce(
        (sum, t) => sum + (t.status === 'completed' ? parseFloat(t.totalAmount || "0") : 0),
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
            <div className="grid gap-4 sm:grid-cols-3">
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
                        <span className="text-sm text-zinc-500">Total Pendapatan</span>
                        <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-zinc-900">
                        {formatCurrency(allTimeTotal)}
                    </p>
                    <p className="text-xs text-zinc-500">
                        Semua waktu
                    </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-500">Total Transaksi</span>
                        <TrendingUp className="h-5 w-5 text-blue-500" />
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

                <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        Semua
                    </button>
                    <button
                        onClick={() => setActiveTab("whatsapp")}
                        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'whatsapp' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        <MessageCircle className="h-4 w-4 text-emerald-500" />
                        WhatsApp
                    </button>
                </div>

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
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Pelanggan
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
                                    <td className="px-4 py-3 text-sm text-zinc-600">
                                        {transaction.customerName || "-"}
                                    </td>
                                    <td className="hidden px-4 py-3 text-sm text-zinc-500 sm:table-cell">
                                        {formatDate(transaction.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${transaction.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            transaction.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                                                transaction.paymentMethod === 'whatsapp' ? 'bg-emerald-100 text-emerald-700' :
                                                    transaction.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' :
                                                        'bg-blue-100 text-blue-700'
                                            }`}>
                                            {transaction.paymentMethod === 'whatsapp' && <MessageCircle className="h-3 w-3" />}
                                            {transaction.status === 'pending' ? 'Pending' :
                                                transaction.status === 'cancelled' ? 'Ditolak' :
                                                    formatPaymentMethod(transaction.paymentMethod)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-zinc-500">
                                        {formatCurrency(transaction.tax || "0")}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-zinc-900">
                                        {formatCurrency(transaction.totalAmount)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {transaction.paymentMethod === 'whatsapp' && transaction.status === 'pending' && (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => triggerAction('approve', transaction.id)}
                                                        disabled={confirmModal.isOpen && confirmModal.transactionId === transaction.id}
                                                        className="rounded-lg bg-green-50 p-2 text-green-600 transition-colors hover:bg-green-100 disabled:opacity-50"
                                                        title="Setujui"
                                                    >
                                                        {confirmModal.isOpen && confirmModal.transactionId === transaction.id && confirmModal.actionType === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => triggerAction('reject', transaction.id)}
                                                        disabled={confirmModal.isOpen && confirmModal.transactionId === transaction.id}
                                                        className="rounded-lg bg-rose-50 p-2 text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
                                                        title="Tolak"
                                                    >
                                                        {confirmModal.isOpen && confirmModal.transactionId === transaction.id && confirmModal.actionType === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            )}
                                            {transaction.status === 'cancelled' && (
                                                <button
                                                    onClick={() => triggerAction('delete', transaction.id, transaction.invoiceNumber)}
                                                    disabled={confirmModal.isOpen && confirmModal.transactionId === transaction.id}
                                                    className="rounded-lg bg-zinc-50 p-2 text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                                                    title="Hapus"
                                                >
                                                    {confirmModal.isOpen && confirmModal.transactionId === transaction.id && confirmModal.actionType === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleViewReceipt(transaction.id)}
                                                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
                                                title="Lihat Struk"
                                            >
                                                <ReceiptIcon className="h-4 w-4" />
                                            </button>
                                        </div>
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
                                    onClick={handleShareReceipt}
                                    disabled={loadingReceipt}
                                    className="rounded-lg bg-zinc-100 p-2 text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-50"
                                    title="Share"
                                >
                                    <Share2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleDownloadReceipt}
                                    disabled={loadingReceipt}
                                    className="rounded-lg bg-zinc-100 p-2 text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-50"
                                    title="Download"
                                >
                                    <Download className="h-4 w-4" />
                                </button>
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
                                    outletName={receiptData.outlet?.name || "Katsira"}
                                    outletAddress={receiptData.outlet?.address || undefined}
                                    cashierName={receiptData.cashier?.name}
                                    customerName={receiptData.customer?.name}
                                    items={receiptData.items}
                                    subtotal={receiptData.transaction.subtotal}
                                    discount={receiptData.transaction.discount}
                                    tax={receiptData.transaction.tax}
                                    totalAmount={receiptData.transaction.totalAmount}

                                    paymentMethod={formatPaymentMethod(receiptData.transaction.paymentMethod)}
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
            {/* Receipt Modal */}
            {/* ... rest of the modal code ... */}

            {/* Custom Confirm Modal (Sedia POS Style) */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${confirmModal.actionType === 'delete' ? 'bg-rose-50 text-rose-600' :
                                confirmModal.actionType === 'reject' ? 'bg-secondary-50 text-secondary-600' : 'bg-primary-50 text-primary-600'
                                }`}>
                                {confirmModal.actionType === 'delete' ? <Trash2 className="h-6 w-6" /> :
                                    confirmModal.actionType === 'reject' ? <X className="h-6 w-6" /> : <Check className="h-6 w-6" />}
                            </div>

                            <h3 className="text-xl font-bold text-zinc-900">{confirmModal.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                                {confirmModal.message}
                            </p>

                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                    className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleConfirmAction}
                                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98] ${confirmModal.actionType === 'delete' ? 'bg-rose-600' :
                                        confirmModal.actionType === 'reject' ? 'bg-secondary-600' : 'bg-primary-600'
                                        }`}
                                >
                                    Ya, Konfirmasi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
