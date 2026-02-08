"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import ConfirmationModal from "@/components/confirmation-modal";
import { toast } from "react-hot-toast";

interface OpnameItem {
    id: string; // Item ID
    productId: string;
    variantId: string | null;
    product: { name: string; sku: string; variantName: string | null };
    systemStock: number;
    actualStock: number | null;
    difference: number | null;
    notes: string | null;
}

interface OpnameDetail {
    id: string;
    status: string;
    date: string;
    notes: string;
    items: OpnameItem[];
    outletId: string;
}

export default function StockOpnameDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [opname, setOpname] = useState<OpnameDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [localCounts, setLocalCounts] = useState<Record<string, number | string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);

    useEffect(() => {
        if (id) fetchOpname();
    }, [id]);

    const fetchOpname = async () => {
        try {
            const res = await fetch(`/api/inventory/opname/${id}`);
            if (res.ok) {
                const data = await res.json();
                setOpname(data);

                // Init local state
                const initialCounts: Record<string, number | string> = {};
                data.items.forEach((item: OpnameItem) => {
                    if (item.actualStock !== null) {
                        initialCounts[item.id] = item.actualStock;
                    }
                });
                setLocalCounts(initialCounts);
            }
        } catch (error) {
            console.error("Failed to fetch opname:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCountChange = (itemId: string, val: string) => {
        setLocalCounts(prev => ({ ...prev, [itemId]: val }));
        setHasUnsavedChanges(true);
    };

    const saveDraft = async (silent = false) => {
        if (!opname) return;
        setIsSaving(true);
        try {
            const itemsToUpdate = Object.entries(localCounts).map(([itemId, val]) => ({
                id: itemId,
                actualStock: val === "" ? null : Number(val)
            }));

            const res = await fetch(`/api/inventory/opname/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: itemsToUpdate })
            });

            if (res.ok) {
                setHasUnsavedChanges(false);
                if (!silent) toast.success("Draft berhasil disimpan");
                fetchOpname(); // Refresh
            }
        } catch (error) {
            console.error("Save failed", error);
        } finally {
            setIsSaving(false);
        }
    };

    const triggerFinalize = async () => {
        // First save any pending changes
        if (hasUnsavedChanges) {
            await saveDraft(true);
        }
        setShowFinalizeModal(true);
    };

    const handleConfirmFinalize = async () => {
        setShowFinalizeModal(false);
        setIsFinalizing(true);
        try {
            const res = await fetch(`/api/inventory/opname/${id}/finalize`, {
                method: "POST"
            });

            if (res.ok) {
                // alert("Stock Opname Selesai!");
                router.push("/dashboard/inventory/opname");
            } else {
                const data = await res.json();
                toast.error("Gagal: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat finalisasi");
        } finally {
            setIsFinalizing(false);
        }
    };

    if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary-500" /></div>;
    if (!opname) return <div className="p-8 text-center">Opname not found</div>;

    const isCompleted = opname.status === 'completed';

    return (
        <div className="space-y-6 pb-24">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/inventory/opname" className="p-2 -ml-2 rounded-full hover:bg-zinc-100 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-zinc-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        {isCompleted ? "Detail Opname" : "Input Opname"}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <span className="font-mono bg-zinc-100 px-1.5 rounded text-zinc-700">#{opname.id.slice(0, 8)}</span>
                        <span>•</span>
                        <span>{new Date(opname.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className={`font-medium ${isCompleted ? "text-primary-600" : "text-yellow-600"}`}>
                            {isCompleted ? "Selesai" : "Draft (Pending)"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50">
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">Produk</th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase text-zinc-500">System</th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase text-zinc-500 bg-primary-50">Actual (Fisik)</th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase text-zinc-500">Selisih</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                        {opname.items.map((item) => {
                            const actualVal = isCompleted ? (item.actualStock ?? '-') : (localCounts[item.id] ?? "");

                            // Client-side diff preview
                            let diff = item.difference;
                            if (!isCompleted && actualVal !== "") {
                                diff = Number(actualVal) - item.systemStock;
                            }

                            return (
                                <tr key={item.id} className="hover:bg-zinc-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-zinc-900">
                                            {item.product.name}
                                            {item.product.variantName && (
                                                <span className="ml-2 text-primary-600">({item.product.variantName})</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-zinc-500">{item.product.sku || '-'}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-zinc-600">{item.systemStock}</td>
                                    <td className="px-4 py-3 text-center bg-primary-50/30">
                                        {isCompleted ? (
                                            <span className="font-bold">{item.actualStock ?? '-'}</span>
                                        ) : (
                                            <input
                                                type="number"
                                                min="0"
                                                value={actualVal}
                                                onChange={(e) => handleCountChange(item.id, e.target.value)}
                                                className="w-24 rounded border border-zinc-300 px-2 py-1 text-center font-medium focus:border-primary-500 focus:outline-none"
                                                placeholder="Total"
                                            />
                                        )}
                                    </td>
                                    <td className={`px-4 py-3 text-center font-bold ${diff === 0 || diff === null ? 'text-zinc-400' : diff > 0 ? 'text-primary-600' : 'text-red-600'
                                        }`}>
                                        {diff !== null && diff > 0 ? `+${diff}` : diff ?? '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer Actions */}
            {!isCompleted && (
                <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white p-4 z-10 shadow-lg">
                    <div className="flex items-center justify-end gap-3 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <button
                            onClick={() => saveDraft()}
                            disabled={isSaving || isFinalizing}
                            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Simpan Draft
                        </button>
                        <button
                            onClick={triggerFinalize}
                            disabled={isSaving || isFinalizing}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                            {isFinalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            Finalisasi & Update Stok
                        </button>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={showFinalizeModal}
                title="Finalisasi Stock Opname"
                message="Tindakan ini akan memperbarui stok di sistem sesuai dengan hasil hitung fisik yang Anda masukkan (Aktual). Perubahan ini tidak dapat dibatalkan. Pastikan data sudah benar."
                onConfirm={handleConfirmFinalize}
                onCancel={() => setShowFinalizeModal(false)}
                confirmText="Ya, Selesaikan"
                cancelText="Cek Kembali"
                variant="primary"
            />
        </div>
    );
}
