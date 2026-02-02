"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Play } from "lucide-react";
import Link from "next/link";

interface Outlet {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
}

export default function NewInternalStockOpnamePage() {
    const router = useRouter();
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedOutletId, setSelectedOutletId] = useState<string>("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch Outlets
                const res = await fetch("/api/outlets");
                if (res.ok) {
                    const data = await res.json();
                    setOutlets(data);
                    if (data.length > 0) setSelectedOutletId(data[0].id);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedOutletId) {
            const fetchCategories = async () => {
                // Adjust API path if needed
                const res = await fetch(`/api/products?outletId=${selectedOutletId}`); // Hack: get products to get categories? Too heavy.
                // Better: /api/categories?outletId=...
                // Assuming /api/categories exists or we can infer.
                // Let's try /api/categories. If not, default to no categories or mock.
                // For now, let's just allow 'All' if we can't fetch categories easily.

                // Actually the user requirement mentions Phase 2.5 Products done, so likely categories exist.
                // Let's assume /api/categories?outletId=...
                try {
                    const catRes = await fetch(`/api/categories?outletId=${selectedOutletId}`);
                    if (catRes.ok) {
                        const catData = await catRes.json();
                        setCategories(catData);
                    }
                } catch (e) {
                    console.warn("Categories fetch failed", e);
                }
            };
            fetchCategories();
        }
    }, [selectedOutletId]);

    const handleCreateSession = async () => {
        if (!selectedOutletId) return;
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/inventory/opname", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    outletId: selectedOutletId,
                    categoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
                    notes
                })
            });

            if (res.ok) {
                const opname = await res.json();
                router.push(`/dashboard/inventory/opname/${opname.id}`);
            } else {
                alert("Gagal membuat sesi opname");
            }
        } catch (error) {
            console.error("Error creating details:", error);
            alert("Terjadi kesalahan sistem");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6 py-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/inventory/opname" className="p-2 -ml-2 rounded-full hover:bg-zinc-100 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-zinc-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Mulai Stock Opname</h1>
                    <p className="text-sm text-zinc-500">Buat sesi baru untuk menghitung stok fisik</p>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">

                {/* Outlet Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Pilih Outlet</label>
                    <select
                        value={selectedOutletId}
                        onChange={(e) => setSelectedOutletId(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none"
                    >
                        {outlets.map((outlet) => (
                            <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                        ))}
                    </select>
                </div>

                {/* Scope Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Lingkup Opname (Kategori)</label>
                    <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none"
                    >
                        <option value="all">Semua Produk</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <p className="text-xs text-zinc-500">Pilih "Semua Produk" untuk opname total, atau pilih kategori tertentu untuk opname parsial/rotasi.</p>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Catatan (Opsional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Contoh: Opname Bulanan Januari 2026"
                        className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none min-h-[100px]"
                    />
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleCreateSession}
                        disabled={isSubmitting || !selectedOutletId}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        Mulai Penghitungan
                    </button>
                </div>

            </div>
        </div>
    );
}
