"use client";

import { useState, useEffect } from "react";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    BarChart3,
    Download,
    RefreshCw,
    Store,
} from "lucide-react";

interface ProfitLossData {
    revenue: number;
    cogs: number;
    grossProfit: number;
    profitMargin: number;
    discount: number;
    transactionCount: number;
}

interface Outlet {
    id: string;
    name: string;
}

export default function ProfitLossPage() {
    const [data, setData] = useState<ProfitLossData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState("today"); // today, week, month
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutletId, setSelectedOutletId] = useState<string>("");

    useEffect(() => {
        fetchOutlets();
    }, []);

    useEffect(() => {
        fetchReport();
    }, [dateRange, customStart, customEnd, selectedOutletId]);

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

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();

            const now = new Date();
            let start = new Date();
            let end = new Date();

            if (dateRange === "today") {
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
            } else if (dateRange === "week") {
                start.setDate(now.getDate() - 7);
            } else if (dateRange === "month") {
                start.setMonth(now.getMonth() - 1);
            }

            params.set("startDate", start.toISOString());
            params.set("endDate", end.toISOString());
            if (selectedOutletId) params.set("outletId", selectedOutletId);

            const res = await fetch(`/api/reports/profit-loss?${params}`);
            if (res.ok) {
                const data = await res.json();
                setData(data);
            }
        } catch (error) {
            console.error("Failed to fetch report:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        const now = new Date();
        let start = new Date();
        let end = new Date();

        if (dateRange === "today") {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (dateRange === "week") {
            start.setDate(now.getDate() - 7);
        } else if (dateRange === "month") {
            start.setMonth(now.getMonth() - 1);
        }

        params.set("startDate", start.toISOString());
        params.set("endDate", end.toISOString());
        if (selectedOutletId) params.set("outletId", selectedOutletId);

        window.open(`/api/reports/profit-loss/export?${params.toString()}`, "_blank");
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#377f7e] shadow-lg shadow-[#377f7e]/20">
                        <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                            Laba & Rugi
                        </h1>
                        <p className="text-sm text-zinc-500 font-medium">
                            Ringkasan kesehatan finansial outlet Anda
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
                        <button
                            onClick={() => setDateRange("today")}
                            className={`rounded-lg px-4 py-1.5 text-xs font-black uppercase transition-all ${dateRange === "today"
                                ? "bg-primary-50 text-primary-600"
                                : "text-zinc-500 hover:text-zinc-900"
                                }`}
                        >
                            Hari Ini
                        </button>
                        <button
                            onClick={() => setDateRange("week")}
                            className={`rounded-lg px-4 py-1.5 text-xs font-black uppercase transition-all ${dateRange === "week"
                                ? "bg-primary-50 text-primary-600"
                                : "text-zinc-500 hover:text-zinc-900"
                                }`}
                        >
                            7 Hari
                        </button>
                        <button
                            onClick={() => setDateRange("month")}
                            className={`rounded-lg px-4 py-1.5 text-xs font-black uppercase transition-all ${dateRange === "month"
                                ? "bg-primary-50 text-primary-600"
                                : "text-zinc-500 hover:text-zinc-900"
                                }`}
                        >
                            30 Hari
                        </button>
                    </div>

                    <button
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 hover:shadow-sm active:scale-95"
                    >
                        <Download className="h-4 w-4 text-zinc-400" />
                        Export
                    </button>
                    <button
                        onClick={fetchReport}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        Update
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
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
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-24 bg-white rounded-3xl border border-zinc-200 shadow-sm">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                </div>
            ) : data ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                    <PnlStatCard
                        title="Total Omzet"
                        value={formatCurrency(data.revenue)}
                        icon={TrendingUp}
                        color="primary"
                    />
                    <PnlStatCard
                        title="Total Diskon"
                        value={formatCurrency(data.discount || 0)}
                        icon={TrendingDown}
                        color="danger"
                    />
                    <PnlStatCard
                        title="HPP (COGS)"
                        value={formatCurrency(data.cogs)}
                        icon={DollarSign}
                        color="warning"
                    />
                    <PnlStatCard
                        title="Laba Kotor"
                        value={formatCurrency(data.grossProfit)}
                        icon={BarChart3}
                        color="success"
                    />
                    <PnlStatCard
                        title="Profit Margin"
                        value={`${data.profitMargin}%`}
                        icon={TrendingUp}
                        color="primary"
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-zinc-200 shadow-sm transition-all text-center">
                    <BarChart3 className="h-16 w-16 text-zinc-200 mb-4" />
                    <p className="text-zinc-500 font-bold">Tidak ada data laporan untuk periode ini</p>
                </div>
            )}
        </div>
    );
}

function PnlStatCard({ title, value, icon: Icon, color = "primary" }: { title: string, value: string, icon: React.ElementType, color: "primary" | "danger" | "warning" | "success" }) {
    const styles = {
        primary: { bg: "bg-primary-50", icon: "text-primary-600", dot: "bg-primary-500", border: 'border-primary-100' },
        danger: { bg: "bg-red-50", icon: "text-red-600", dot: "bg-red-500", border: 'border-red-100' },
        warning: { bg: "bg-orange-50", icon: "text-orange-600", dot: "bg-orange-500", border: 'border-orange-100' },
        success: { bg: "bg-green-50", icon: "text-green-600", dot: "bg-green-500", border: 'border-green-100' },
    };

    const style = styles[color];

    return (
        <div className="group rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-zinc-300">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{title}</span>
                <div className={`p-2.5 rounded-xl border transition-transform group-hover:rotate-12 ${style.bg} ${style.icon} ${style.border}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <h3 className={`text-lg font-black tracking-tight line-clamp-1 transition-colors ${color === 'danger' ? 'text-red-600' : 'text-zinc-900'}`}>{value}</h3>
            <div className="mt-2 flex items-center gap-1.5">
                <div className={`h-1 w-4 rounded-full ${style.dot}`} />
            </div>
        </div>
    );
}
