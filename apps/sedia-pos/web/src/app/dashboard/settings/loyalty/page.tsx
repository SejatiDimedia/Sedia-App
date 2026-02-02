"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Settings, Star, Gift, Coins, Loader2, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { getOutlets } from "@/actions/outlets";

interface Tier {
    id: string;
    name: string;
    minPoints: number;
    discountPercent: string;
    pointMultiplier: string;
    color: string;
    isDefault: boolean;
}

interface LoyaltySettings {
    pointsPerAmount: number;
    amountPerPoint: number;
    redemptionRate: number;
    redemptionValue: number;
    isEnabled: boolean;
}

export default function LoyaltySettingsPage() {
    const [selectedOutletId, setSelectedOutletId] = useState("");
    const [outlets, setOutlets] = useState<{ id: string; name: string }[]>([]);
    const [settings, setSettings] = useState<LoyaltySettings>({
        pointsPerAmount: 1,
        amountPerPoint: 1000,
        redemptionRate: 100,
        redemptionValue: 10000,
        isEnabled: true,
    });
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // New tier form
    const [showNewTier, setShowNewTier] = useState(false);
    const [newTier, setNewTier] = useState({
        name: "",
        minPoints: 0,
        discountPercent: "0",
        pointMultiplier: "1.00",
        color: "#6b7280",
        isDefault: false,
    });

    useEffect(() => {
        loadOutlets();
    }, []);

    useEffect(() => {
        if (selectedOutletId) {
            loadLoyaltyData();
        }
    }, [selectedOutletId]);

    const loadOutlets = async () => {
        const data = await getOutlets();
        setOutlets(data);
        if (data.length > 0) {
            setSelectedOutletId(data[0].id);
        }
        setIsLoading(false);
    };

    const loadLoyaltyData = async () => {
        setIsLoading(true);
        try {
            // Load settings
            const settingsRes = await fetch(`/api/loyalty/settings?outletId=${selectedOutletId}`);
            const settingsData = await settingsRes.json();
            setSettings(settingsData);

            // Load tiers
            const tiersRes = await fetch(`/api/loyalty/tiers?outletId=${selectedOutletId}`);
            const tiersData = await tiersRes.json();
            setTiers(tiersData);
        } catch (error) {
            console.error("Failed to load loyalty data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            await fetch("/api/loyalty/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ outletId: selectedOutletId, ...settings }),
            });
            alert("Pengaturan berhasil disimpan!");
        } catch (error) {
            console.error("Failed to save settings:", error);
            alert("Gagal menyimpan pengaturan");
        } finally {
            setIsSaving(false);
        }
    };

    const createTier = async () => {
        if (!newTier.name) {
            alert("Nama tier harus diisi");
            return;
        }

        try {
            const res = await fetch("/api/loyalty/tiers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ outletId: selectedOutletId, ...newTier }),
            });

            if (res.ok) {
                const created = await res.json();
                setTiers([...tiers, created].sort((a, b) => a.minPoints - b.minPoints));
                setNewTier({
                    name: "",
                    minPoints: 0,
                    discountPercent: "0",
                    pointMultiplier: "1.00",
                    color: "#6b7280",
                    isDefault: false,
                });
                setShowNewTier(false);
            }
        } catch (error) {
            console.error("Failed to create tier:", error);
        }
    };

    const deleteTier = async (tierId: string) => {
        if (!confirm("Hapus tier ini?")) return;
        try {
            await fetch(`/api/loyalty/tiers/${tierId}`, { method: "DELETE" });
            setTiers(tiers.filter((t) => t.id !== tierId));
        } catch (error) {
            console.error("Failed to delete tier:", error);
        }
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);

    if (isLoading && outlets.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-6">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/settings"
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-primary-50"
                    >
                        <ArrowLeft className="h-5 w-5 text-primary-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-primary-900">Pengaturan Loyalty</h1>
                        <p className="text-sm text-primary-500">Kelola member tier dan poin reward</p>
                    </div>
                </div>

                {/* Outlet Selector */}
                <select
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    className="rounded-xl border border-primary-200 bg-white px-4 py-2 text-primary-900"
                >
                    {outlets.map((outlet) => (
                        <option key={outlet.id} value={outlet.id}>
                            {outlet.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Points Settings */}
                <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-100">
                            <Coins className="h-5 w-5 text-secondary-600" />
                        </div>
                        <h2 className="text-lg font-bold text-primary-900">Pengaturan Poin</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Enable/Disable status badge */}
                        <div className={`flex items-center gap-2 rounded-xl p-4 transition-all ${settings.isEnabled ? 'bg-primary-50 border border-primary-200 shadow-sm shadow-primary-100' : 'bg-zinc-50 border border-zinc-200'}`}>
                            <input
                                type="checkbox"
                                id="status-toggle"
                                checked={settings.isEnabled}
                                onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                                className="h-6 w-6 rounded-lg border-primary-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="status-toggle" className="flex-1 cursor-pointer">
                                <span className={`font-bold transition-colors ${settings.isEnabled ? 'text-primary-900' : 'text-zinc-500'}`}>
                                    {settings.isEnabled ? 'Program Loyalty Aktif' : 'Program Loyalty Nonaktif'}
                                </span>
                                <p className="text-xs text-primary-500">Pelanggan bisa mengumpulkan dan menukar poin di POS.</p>
                            </label>
                        </div>

                        {/* Earning Rate */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-primary-600">
                                Poin per Transaksi
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={settings.pointsPerAmount}
                                    onChange={(e) =>
                                        setSettings({ ...settings, pointsPerAmount: parseInt(e.target.value) || 1 })
                                    }
                                    className="w-20 rounded-lg border border-primary-200 px-3 py-2 text-center"
                                />
                                <span className="text-primary-600">poin per</span>
                                <input
                                    type="number"
                                    value={settings.amountPerPoint}
                                    onChange={(e) =>
                                        setSettings({ ...settings, amountPerPoint: parseInt(e.target.value) || 1000 })
                                    }
                                    className="w-28 rounded-lg border border-primary-200 px-3 py-2 text-center"
                                />
                                <span className="text-primary-600">Rupiah</span>
                            </div>
                            <p className="mt-1 text-xs text-primary-400">
                                Contoh: Transaksi {formatCurrency(settings.amountPerPoint * 10)} = {settings.pointsPerAmount * 10} poin
                            </p>
                        </div>

                        {/* Redemption Rate */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-primary-600">
                                Tukar Poin
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={settings.redemptionRate}
                                    onChange={(e) =>
                                        setSettings({ ...settings, redemptionRate: parseInt(e.target.value) || 100 })
                                    }
                                    className="w-24 rounded-lg border border-primary-200 px-3 py-2 text-center"
                                />
                                <span className="text-primary-600">poin =</span>
                                <input
                                    type="number"
                                    value={settings.redemptionValue}
                                    onChange={(e) =>
                                        setSettings({ ...settings, redemptionValue: parseInt(e.target.value) || 10000 })
                                    }
                                    className="w-32 rounded-lg border border-primary-200 px-3 py-2 text-center"
                                />
                                <span className="text-primary-600">Rupiah diskon</span>
                            </div>
                            <p className="mt-1 text-xs text-primary-400">
                                Contoh: {settings.redemptionRate} poin bisa ditukar jadi diskon {formatCurrency(settings.redemptionValue)}
                            </p>
                        </div>

                        <button
                            onClick={saveSettings}
                            disabled={isSaving}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary-500 py-4 font-bold text-zinc-900 shadow-lg shadow-secondary-500/30 hover:bg-secondary-600 active:scale-95 disabled:opacity-50 transition-all"
                        >
                            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Simpan Pengaturan
                        </button>
                    </div>
                </div>

                {/* Member Tiers */}
                <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 shadow-sm">
                                <Star className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-primary-900">Member Tier</h2>
                        </div>
                        <button
                            onClick={() => setShowNewTier(true)}
                            className="flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-primary-500/20 hover:bg-primary-600 active:scale-95 transition-all"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Tier
                        </button>
                    </div>

                    {/* Tiers List */}
                    <div className="space-y-3">
                        {tiers.length === 0 ? (
                            <p className="text-center text-sm text-primary-400 py-8">
                                Belum ada tier. Tambahkan tier pertama Anda.
                            </p>
                        ) : (
                            tiers.map((tier) => (
                                <div
                                    key={tier.id}
                                    className="group flex items-center gap-4 rounded-2xl border border-primary-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-primary-200"
                                >
                                    <div
                                        className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner"
                                        style={{ backgroundColor: tier.color + "20", color: tier.color }}
                                    >
                                        <Star className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-primary-900">{tier.name}</span>
                                            {tier.isDefault && (
                                                <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-bold text-primary-600 uppercase tracking-tight">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                            <p className="text-xs font-medium text-zinc-500 flex items-center gap-1">
                                                <Coins className="h-3 w-3" /> Min: {tier.minPoints}
                                            </p>
                                            <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                                                <Gift className="h-3 w-3" /> Diskon: {parseFloat(tier.discountPercent)}%
                                            </p>
                                            <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
                                                <Star className="h-3 w-3" /> Multiplier: {tier.pointMultiplier}x
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteTier(tier.id)}
                                        className="rounded-xl p-2.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* New Tier Form */}
                    {showNewTier && (
                        <div className="mt-4 rounded-xl border-2 border-dashed border-primary-200 p-4">
                            <h3 className="mb-4 font-semibold text-primary-900">Tier Baru</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-primary-600">Nama Tier</label>
                                    <input
                                        type="text"
                                        value={newTier.name}
                                        onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                                        placeholder="Gold, Silver, Bronze..."
                                        className="w-full rounded-lg border border-primary-200 px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-primary-600">Min. Poin</label>
                                    <input
                                        type="number"
                                        value={newTier.minPoints}
                                        onChange={(e) => setNewTier({ ...newTier, minPoints: parseInt(e.target.value) || 0 })}
                                        className="w-full rounded-lg border border-primary-200 px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-primary-600">Diskon (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={newTier.discountPercent}
                                        onChange={(e) => setNewTier({ ...newTier, discountPercent: e.target.value })}
                                        className="w-full rounded-lg border border-primary-200 px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-primary-600">Warna Badge</label>
                                    <input
                                        type="color"
                                        value={newTier.color}
                                        onChange={(e) => setNewTier({ ...newTier, color: e.target.value })}
                                        className="h-10 w-full rounded-lg border border-primary-200"
                                    />
                                </div>
                            </div>
                            <label className="mt-3 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={newTier.isDefault}
                                    onChange={(e) => setNewTier({ ...newTier, isDefault: e.target.checked })}
                                    className="rounded border-primary-300"
                                />
                                <span className="text-sm text-primary-600">Jadikan tier default untuk member baru</span>
                            </label>
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => setShowNewTier(false)}
                                    className="flex-1 rounded-lg border border-primary-200 py-2 font-medium text-primary-700 hover:bg-primary-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={createTier}
                                    className="flex-1 rounded-lg bg-primary-600 py-2 font-medium text-white hover:bg-primary-700"
                                >
                                    Simpan Tier
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
