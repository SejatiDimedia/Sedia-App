"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Truck,
    Package,
    Receipt,
    AlertTriangle,
    Printer,
    Home
} from "lucide-react";
import { getPurchaseOrder, updatePurchaseOrderStatus, receivePurchaseOrder } from "@/actions/purchase-orders";
import Link from "next/link";
import ConfirmationModal from "@/components/confirmation-modal";

interface PurchaseOrder {
    id: string;
    invoiceNumber: string;
    status: "draft" | "ordered" | "received" | "cancelled";
    supplier: { name: string; contactPerson: string; phone: string; address: string };
    totalAmount: number;
    orderDate: Date;
    expectedDate?: Date;
    receivedDate?: Date;
    notes?: string;
    items: {
        id: string;
        product: { name: string };
        variant?: { name: string };
        quantity: number;
        costPrice: number;
        subtotal: number;
    }[];
}

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [po, setPo] = useState<PurchaseOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: "primary" | "danger" | "warning";
        confirmText?: string;
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        variant: "primary",
    });

    useEffect(() => {
        const load = async () => {
            const resolvedParams = await params;
            const res = await getPurchaseOrder(resolvedParams.id);
            if (res.data) setPo(res.data as any);
            setIsLoading(false);
        };
        load();
    }, [params]);

    const showConfirm = (config: Omit<typeof confirmState, "isOpen" | "variant"> & { variant?: "primary" | "danger" | "warning" }) => {
        setConfirmState({
            isOpen: true,
            variant: config.variant || "primary",
            ...config
        });
    };

    const handleConfirmAction = async () => {
        setIsProcessing(true);
        try {
            await confirmState.onConfirm();
        } finally {
            setIsProcessing(false);
            setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
    };

    const handleUpdateStatus = (status: "ordered" | "cancelled") => {
        if (!po) return;

        showConfirm({
            title: status === 'ordered' ? "Tandai Dipesan" : "Batalkan Pesanan",
            message: status === 'ordered'
                ? "Apakah Anda yakin ingin menandai pesanan ini sebagai dipesan? Status akan berubah menjadi Ordered."
                : "Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.",
            variant: status === 'ordered' ? "primary" : "danger",
            confirmText: status === 'ordered' ? "Ya, Tandai Dipesan" : "Ya, Batalkan",
            onConfirm: async () => {
                await updatePurchaseOrderStatus(po.id, status);
                const res = await getPurchaseOrder(po.id);
                if (res.data) setPo(res.data as any);
            }
        });
    };

    const handleReceive = () => {
        if (!po) return;

        showConfirm({
            title: "Terima Barang",
            message: "⚠️ PERHATIAN: Tindakan ini akan menambah stok inventaris secara permanen berdasarkan jumlah barang di PO ini. Pastikan stok fisik sudah sesuai.",
            variant: "warning",
            confirmText: "Ya, Terima Barang",
            onConfirm: async () => {
                const res = await receivePurchaseOrder(po.id);
                if (res.success) {
                    const resLoad = await getPurchaseOrder(po.id);
                    if (resLoad.data) setPo(resLoad.data as any);
                    alert("Barang berhasil diterima! Stok inventaris telah diperbarui.");
                } else {
                    alert("Gagal menerima pesanan: " + res.error);
                }
            }
        });
    };

    if (isLoading) return <div className="p-12 text-center">Loading...</div>;
    if (!po) return <div className="p-12 text-center">Purchase Order tidak ditemukan</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Nav */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/dashboard/purchase-orders"
                    className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-zinc-500" />
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-zinc-900">{po.invoiceNumber}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${po.status === 'received' ? 'bg-green-100 text-green-700 border-green-200' :
                            po.status === 'ordered' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                po.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                                    'bg-zinc-100 text-zinc-700 border-zinc-200'
                            }`}>
                            {po.status}
                        </span>
                    </div>
                    <p className="text-sm text-zinc-500 flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        Dipesan: {new Date(po.orderDate).toLocaleDateString("id-ID", { dateStyle: 'long' })}
                    </p>
                </div>
                <div className="flex-1" />
                <button className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-lg">
                    <Printer className="h-5 w-5" />
                </button>
            </div>

            {/* Action Bar */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="text-sm font-medium text-zinc-600">
                    Aksi Cepat:
                </div>
                <div className="flex gap-2">
                    {po.status === 'draft' && (
                        <>
                            <button
                                onClick={() => handleUpdateStatus('cancelled')}
                                disabled={isProcessing}
                                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                                Batalkan
                            </button>
                            <button
                                onClick={() => handleUpdateStatus('ordered')}
                                disabled={isProcessing}
                                className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors"
                            >
                                Tandai Dipesan (Sent)
                            </button>
                        </>
                    )}
                    {po.status === 'ordered' && (
                        <button
                            onClick={handleReceive}
                            disabled={isProcessing}
                            className="px-6 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md shadow-green-500/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Terima Barang (Restock)
                        </button>
                    )}
                    {po.status === 'cancelled' && (
                        <span className="text-sm text-zinc-400 italic">Pesanan dibatalkan</span>
                    )}
                    {po.status === 'received' && (
                        <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2 border border-green-200">
                            <CheckCircle2 className="h-4 w-4" />
                            Barang Diterima & Stok Masuk
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Details */}
                <div className="md:col-span-2 space-y-6">
                    {/* Items Table */}
                    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 font-bold text-zinc-900 flex items-center gap-2">
                            <Package className="h-4 w-4 text-zinc-500" />
                            Rincian Barang
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white text-zinc-500 border-b border-zinc-100">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Produk</th>
                                    <th className="px-6 py-3 font-medium text-center">Qty</th>
                                    <th className="px-6 py-3 font-medium text-right">Harga Satuan</th>
                                    <th className="px-6 py-3 font-medium text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {po.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-zinc-900">{item.product.name}</div>
                                            {item.variant && <span className="text-xs text-zinc-500 bg-zinc-100 px-1 rounded">{item.variant.name}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">{item.quantity}</td>
                                        <td className="px-6 py-4 text-right text-zinc-500">
                                            Rp {item.costPrice.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-zinc-900">
                                            Rp {item.subtotal.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-zinc-50 border-t border-zinc-200">
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-right font-bold text-zinc-600 uppercase text-xs">Total Pembelian</td>
                                    <td className="px-6 py-4 text-right font-black text-lg text-zinc-900">
                                        Rp {po.totalAmount.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Timeline / Logs Placeholder */}
                    {po.receivedDate && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-green-900">Pesanan Selesai</h4>
                                <p className="text-sm text-green-700 mt-1">
                                    Barang telah diterima pada <strong>{new Date(po.receivedDate).toLocaleString('id-ID')}</strong>.
                                    Stok inventaris telah diperbarui otomatis.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Supplier Info */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                        <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <Truck className="h-4 w-4 text-zinc-500" />
                            Supplier
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold">Nama</p>
                                <p className="font-medium text-zinc-900">{po.supplier.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold">Kontak</p>
                                <p className="text-sm text-zinc-700">{po.supplier.contactPerson} ({po.supplier.phone})</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold">Alamat</p>
                                <p className="text-sm text-zinc-700 whitespace-pre-line">{po.supplier.address || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                        <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-zinc-500" />
                            Info Lainnya
                        </h3>
                        <div className="space-y-3">
                            {po.expectedDate && (
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Estimasi Tiba</p>
                                    <p className="text-sm text-zinc-700">{new Date(po.expectedDate).toLocaleDateString('id-ID')}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-bold">Catatan</p>
                                <p className="text-sm text-zinc-700 italic">{po.notes || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant}
                confirmText={confirmState.confirmText}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                isLoading={isProcessing}
            />
        </div>
    );
}
