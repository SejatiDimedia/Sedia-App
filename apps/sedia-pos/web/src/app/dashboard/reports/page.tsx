"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    ShoppingCart,
    Calendar,
    RefreshCw,
    Download,
    FileText,
    Store,
} from "lucide-react";

interface Summary {
    totalRevenue: number;
    transactionCount: number;
    averageTicket: number;
    todayRevenue: number;
    todayTransactions: number;
}

interface SalesByDate {
    date: string;
    revenue: number;
    transactions: number;
}

interface TopProduct {
    name: string;
    quantity: number;
    revenue: number;
}

interface Outlet {
    id: string;
    name: string;
}

export default function ReportsPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [salesByDate, setSalesByDate] = useState<SalesByDate[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutletId, setSelectedOutletId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    // Date range (default: last 7 days)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return d.toISOString().split("T")[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

    useEffect(() => {
        fetchOutlets();
    }, []);

    useEffect(() => {
        fetchData();
    }, [selectedOutletId, startDate, endDate]);

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

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedOutletId) params.set("outletId", selectedOutletId);
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);

            const [summaryRes, salesRes, productsRes] = await Promise.all([
                fetch(`/api/reports/summary?${params}`),
                fetch(`/api/reports/sales-by-date?${params}`),
                fetch(`/api/reports/top-products?${params}`),
            ]);

            if (summaryRes.ok) setSummary(await summaryRes.json());
            if (salesRes.ok) setSalesByDate(await salesRes.json());
            if (productsRes.ok) setTopProducts(await productsRes.json());
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (selectedOutletId) params.set("outletId", selectedOutletId);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        window.open(`/api/reports/export?${params.toString()}`, "_blank");
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
    };

    const maxRevenue = Math.max(...salesByDate.map((s) => s.revenue), 1);
    const maxQuantity = Math.max(...topProducts.map((p) => p.quantity), 1);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#377f7e] shadow-lg shadow-[#377f7e]/20">
                        <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                            Analitik Laporan
                        </h1>
                        <p className="text-sm text-zinc-500 font-medium">
                            Pantau performa bisnis Anda secara real-time
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/dashboard/reports/profit-loss"
                        className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-bold text-primary-600 transition-all hover:bg-primary-50 hover:shadow-sm active:scale-95"
                    >
                        <FileText className="h-4 w-4" />
                        Laba & Rugi
                    </Link>
                    <div className="h-8 w-px bg-zinc-200 hidden sm:block mx-1" />
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 hover:shadow-sm active:scale-95"
                    >
                        <Download className="h-4 w-4 text-zinc-400" />
                        Export
                    </button>
                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        Update
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
                    <Store className="h-4 w-4 text-zinc-400" />
                    <select
                        value={selectedOutletId}
                        onChange={(e) => setSelectedOutletId(e.target.value)}
                        className="bg-transparent text-sm font-bold text-zinc-900 focus:outline-none min-w-[140px]"
                    >
                        <option value="">Semua Outlet</option>
                        {outlets.map((outlet) => (
                            <option key={outlet.id} value={outlet.id}>
                                {outlet.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-3 px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-sm font-bold text-zinc-900 focus:outline-none"
                    />
                    <span className="text-zinc-300 font-bold">/</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-sm font-bold text-zinc-900 focus:outline-none"
                    />
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Omzet Hari Ini"
                    value={formatCurrency(summary?.todayRevenue || 0)}
                    icon={DollarSign}
                    subtitle={`${summary?.todayTransactions || 0} Transaksi`}
                    color="primary"
                    isLoading={isLoading}
                />
                <StatCard
                    title="Total Omzet"
                    value={formatCurrency(summary?.totalRevenue || 0)}
                    icon={TrendingUp}
                    subtitle="Periode terpilih"
                    color="success"
                    isLoading={isLoading}
                />
                <StatCard
                    title="Volume Penjualan"
                    value={String(summary?.transactionCount || 0)}
                    icon={ShoppingCart}
                    subtitle="Transaksi Sukses"
                    color="secondary"
                    isLoading={isLoading}
                />
                <StatCard
                    title="Average Basket"
                    value={formatCurrency(summary?.averageTicket || 0)}
                    icon={Package}
                    subtitle="Nilai per transaksi"
                    color="zinc"
                    isLoading={isLoading}
                />
            </div>

            {/* Charts & Details */}
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Sales Chart */}
                <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                                Tren Penjualan
                            </h3>
                            <p className="text-sm text-zinc-500 font-medium mt-1">Perbandingan harian volume transaksi</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-primary-500" />
                            <span className="text-xs font-bold text-zinc-600">Revenue</span>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex h-72 items-center justify-center">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                        </div>
                    ) : salesByDate.length === 0 ? (
                        <div className="flex h-72 items-center justify-center rounded-2xl bg-zinc-50 border border-dashed border-zinc-200">
                            <div className="text-center">
                                <BarChart3 className="mx-auto mb-3 h-12 w-12 text-zinc-300" />
                                <p className="text-sm font-bold text-zinc-500">Data belum tersedia untuk periode ini</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-72 items-end justify-between gap-3 px-2">
                            {salesByDate.map((day) => (
                                <div key={day.date} className="flex flex-1 flex-col items-center gap-4 group">
                                    <div className="relative w-full flex flex-col items-center justify-end h-[220px]">
                                        <div
                                            className="w-full max-w-[40px] rounded-xl bg-gradient-to-t from-primary-600 to-primary-400 transition-all duration-500 group-hover:scale-x-110 group-hover:shadow-lg group-hover:shadow-primary-500/20"
                                            style={{
                                                height: `${Math.max((day.revenue / maxRevenue) * 100, 4)}%`,
                                            }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap z-10">
                                                {formatCurrency(day.revenue)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider transition-colors group-hover:text-primary-600">
                                        {formatDate(day.date)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Products */}
                <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                            MVP Produk
                        </h3>
                        <p className="text-sm text-zinc-500 font-medium mt-1">Produk dengan performa terbaik</p>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-zinc-50" />
                            ))}
                        </div>
                    ) : topProducts.length === 0 ? (
                        <div className="flex h-72 items-center justify-center rounded-2xl bg-zinc-50 border border-dashed border-zinc-200">
                            <div className="text-center p-6">
                                <Package className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                                <p className="text-sm font-bold text-zinc-500">Produk akan muncul setelah transaksi</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {topProducts.slice(0, 5).map((product, index) => (
                                <div key={product.name} className="flex flex-col gap-2 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-xs font-black text-primary-600 border border-primary-100 transition-colors group-hover:bg-primary-500 group-hover:text-white">
                                                #{index + 1}
                                            </div>
                                            <span className="text-sm font-bold text-zinc-800 line-clamp-1">
                                                {product.name}
                                            </span>
                                        </div>
                                        <span className="text-xs font-black text-zinc-500 transition-colors group-hover:text-primary-600">
                                            {product.quantity} <span className="text-[10px] uppercase">Terjual</span>
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-secondary-500 to-secondary-400 transition-all duration-700"
                                            style={{ width: `${(product.quantity / maxQuantity) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    subtitle,
    color = "zinc",
    isLoading,
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    subtitle: string;
    color?: "primary" | "secondary" | "success" | "zinc";
    isLoading?: boolean;
}) {
    const colorStyles = {
        primary: {
            bg: "bg-primary-50",
            icon: "text-primary-600",
            border: "border-primary-100",
            dot: "bg-primary-500"
        },
        secondary: {
            bg: "bg-secondary-50",
            icon: "text-secondary-600",
            border: "border-secondary-100",
            dot: "bg-secondary-500"
        },
        success: {
            bg: "bg-green-50",
            icon: "text-green-600",
            border: "border-green-100",
            dot: "bg-green-500"
        },
        zinc: {
            bg: "bg-zinc-50",
            icon: "text-zinc-600",
            border: "border-zinc-200",
            dot: "bg-zinc-400"
        }
    };

    const style = colorStyles[color];

    return (
        <div className="group rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-zinc-300">
            <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">{title}</span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-transform group-hover:scale-110 ${style.bg} ${style.icon} ${style.border}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div className="mt-6">
                {isLoading ? (
                    <div className="h-8 w-3/4 animate-pulse rounded-lg bg-zinc-100" />
                ) : (
                    <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{value}</h3>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${style.dot} animate-pulse`} />
                    <p className="text-xs font-bold text-zinc-500">{subtitle}</p>
                </div>
            </div>
        </div>
    );
}

