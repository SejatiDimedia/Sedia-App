"use client";

import { useState, useEffect } from "react";
import { Percent, Store, Save, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function TaxManagementPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        isEnabled: false,
        name: "PPN",
        rate: "11",
        isInclusive: false,
        type: "percentage"
    });

    const [outlets, setOutlets] = useState<any[]>([]);
    const [activeOutletId, setActiveOutletId] = useState<string | null>(null);

    useEffect(() => {
        fetchOutlets();
    }, []);

    async function fetchOutlets() {
        try {
            const res = await fetch("/api/outlets");
            if (res.ok) {
                const fetchedOutlets = await res.json();
                if (Array.isArray(fetchedOutlets) && fetchedOutlets.length > 0) {
                    setOutlets(fetchedOutlets);

                    // Check for stored outlet
                    const storedOutletId = typeof window !== 'undefined' ? localStorage.getItem("activeOutletId") : null;

                    if (storedOutletId) {
                        // Validate if stored outlet still exists in the list
                        const exists = fetchedOutlets.find((o: any) => o.id === storedOutletId);
                        const targetId = exists ? storedOutletId : fetchedOutlets[0].id;

                        setActiveOutletId(targetId);
                        fetchSettings(targetId);
                        if (!exists) localStorage.setItem("activeOutletId", targetId);
                    } else {
                        // Auto-select first
                        const firstId = fetchedOutlets[0].id;
                        localStorage.setItem("activeOutletId", firstId);
                        setActiveOutletId(firstId);
                        fetchSettings(firstId);
                        toast.success(`Outlet ${fetchedOutlets[0].name} otomatis dipilih`);
                    }
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error("Failed to fetch outlets:", error);
            setLoading(false);
        }
    }

    async function fetchSettings(outletId: string) {
        setLoading(true);
        try {
            const res = await fetch(`/api/tax-settings?outletId=${outletId}`);
            if (!res.ok) throw new Error("Outlet not found");
            const data = await res.json();
            if (data) {
                setSettings({
                    isEnabled: data.is_enabled ?? data.isEnabled ?? false,
                    name: data.name || "PPN",
                    rate: data.rate || "0",
                    isInclusive: data.is_inclusive ?? data.isInclusive ?? false,
                    type: data.type || "percentage"
                });
            }
        } catch (error) {
            console.error("Failed to fetch tax settings:", error);
            // Don't toast error on 404 (just means no settings yet), but maybe on 500
        } finally {
            setLoading(false);
        }
    }

    const handleSave = async () => {
        if (!activeOutletId) {
            toast.error("Pilih outlet terlebih dahulu");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/tax-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    outletId: activeOutletId,
                    ...settings
                }),
            });

            if (!res.ok) throw new Error("Gagal menyimpan pengaturan");

            toast.success("Pengaturan pajak berhasil disimpan");
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center text-zinc-500">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                    <p className="text-sm font-medium">Memuat pengaturan pajak...</p>
                </div>
            </div>
        );
    }

    if (!activeOutletId) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-zinc-500">
                <div className="rounded-full bg-zinc-100 p-4">
                    <Store className="h-10 w-10 text-zinc-400" />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-zinc-900">Outlet Belum Dipilih</h3>
                    <p className="max-w-xs text-sm">Silakan pilih outlet di halaman utama dashboard terlebih dahulu untuk mengatur pajak.</p>
                </div>
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-700"
                >
                    Ke Dashboard
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
                        <div className="p-2 bg-primary-50 rounded-lg">
                            <Percent className="h-6 w-6 text-primary-600" />
                        </div>
                        Pajak & Biaya
                    </h1>
                    <p className="text-sm text-zinc-500">Konfigurasi perhitungan pajak otomatis untuk transaksi di outlet Anda</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                    {/* Outlet Selector */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                            <Store className="h-4 w-4" />
                        </div>
                        <select
                            value={activeOutletId || ""}
                            onChange={(e) => {
                                const newId = e.target.value;
                                setActiveOutletId(newId);
                                localStorage.setItem("activeOutletId", newId);
                                fetchSettings(newId);
                            }}
                            className="h-full rounded-xl border border-zinc-200 bg-white pl-10 pr-8 py-2.5 text-sm font-medium text-zinc-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none appearance-none min-w-[200px]"
                        >
                            <option value="" disabled>Pilih Outlet</option>
                            {outlets.map((outlet) => (
                                <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-zinc-500">
                            <ChevronRight className="h-4 w-4 rotate-90" />
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-700 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? "Simpan" : "Simpan"}
                    </button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="border-b border-zinc-100 bg-zinc-50/50 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900">Status Pajak</h3>
                            <p className="text-xs text-zinc-500">Aktifkan untuk mulai menghitung pajak secara otomatis di POS</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold ${settings.isEnabled ? "text-primary-600" : "text-zinc-400"}`}>
                                {settings.isEnabled ? "AKTIF" : "NONAKTIF"}
                            </span>
                            <button
                                onClick={() => setSettings({ ...settings, isEnabled: !settings.isEnabled })}
                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.isEnabled ? "bg-primary-500" : "bg-zinc-200"
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${settings.isEnabled ? "translate-x-5" : "translate-x-0"
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                <div className={`p-8 space-y-8 transition-all duration-300 ${!settings.isEnabled && "opacity-50 grayscale pointer-events-none"}`}>
                    <div className="grid gap-8 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Nama Pajak</label>
                            <input
                                type="text"
                                value={settings.name}
                                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                placeholder="Contoh: PPN, Pajak Resto"
                                className="w-full rounded-xl border border-zinc-200 bg-white px-5 py-4 text-zinc-900 shadow-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none transition-all placeholder:text-zinc-300 font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Persentase (%)</label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    value={settings.rate}
                                    onChange={(e) => setSettings({ ...settings, rate: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full rounded-xl border border-zinc-200 bg-white px-5 py-4 pr-12 text-zinc-900 shadow-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none transition-all font-bold text-lg"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-zinc-400 font-black">
                                    %
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6">
                        {/* Decorative background icon */}
                        <div className="absolute -right-4 -top-4 opacity-[0.03]">
                            <Percent size={120} />
                        </div>

                        <div className="relative z-10 flex items-start gap-4">
                            <div className="mt-1 flex-shrink-0">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${settings.isInclusive ? "bg-primary-100 text-primary-600" : "bg-zinc-100 text-zinc-400"}`}>
                                    <Store size={20} />
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="isInclusive" className="cursor-pointer">
                                        <span className="text-base font-bold text-zinc-900">Harga Termasuk Pajak (Inclusive)</span>
                                        <p className="mt-1 text-sm text-zinc-500 max-w-lg leading-relaxed">
                                            Aktifkan jika harga produk yang Anda input di menu Produk sudah termasuk pajak.
                                            Jika dimatikan, pajak akan ditambahkan di atas harga jual produk.
                                        </p>
                                    </label>
                                    <input
                                        type="checkbox"
                                        id="isInclusive"
                                        checked={settings.isInclusive}
                                        onChange={(e) => setSettings({ ...settings, isInclusive: e.target.checked })}
                                        className="h-6 w-6 rounded-lg border-zinc-300 text-primary-600 focus:ring-primary-500 cursor-pointer shadow-sm transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="bg-primary-50/50 p-4 border-t border-primary-100 flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                    <p className="text-xs font-semibold text-primary-700 italic">
                        Tip: Pajak yang telah diatur di sini akan otomatis muncul sebagai baris baru pada struk belanja pelanggan.
                    </p>
                </div>
            </div>
        </div>
    );
}
