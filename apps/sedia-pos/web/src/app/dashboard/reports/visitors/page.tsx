"use client";

import { useState, useEffect } from "react";
import {
    Eye,
    Calendar,
    RefreshCw,
    Store,
    Users,
    TrendingUp,
    BarChart3,
    MapPin,
} from "lucide-react";

interface DailyVisitor {
    visitDate: string;
    count: number;
}

interface OutletVisitor {
    outletId: string;
    outletName: string;
    count: number;
}

interface LocationVisitor {
    city: string;
    region: string;
    country: string;
    count: number;
}

interface Outlet {
    id: string;
    name: string;
}

interface Summary {
    totalVisitors: number;
    todayVisitors: number;
}

export default function VisitorAnalyticsPage() {
    const [dailyVisitors, setDailyVisitors] = useState<DailyVisitor[]>([]);
    const [perOutlet, setPerOutlet] = useState<OutletVisitor[]>([]);
    const [locations, setLocations] = useState<LocationVisitor[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalVisitors: 0, todayVisitors: 0 });
    const [selectedOutletId, setSelectedOutletId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 13);
        return d.toISOString().split("T")[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

    useEffect(() => {
        fetchData();
    }, [selectedOutletId, startDate, endDate]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedOutletId) params.set("outletId", selectedOutletId);
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);

            const res = await fetch(`/api/reports/visitors?${params}`);
            if (res.ok) {
                const data = await res.json();
                setDailyVisitors(data.dailyVisitors || []);
                setPerOutlet(data.perOutlet || []);
                setLocations(data.locations || []);
                setOutlets(data.outlets || []);
                setSummary(data.summary || { totalVisitors: 0, todayVisitors: 0 });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatShortDate = (dateStr: string) => {
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    };

    const maxDaily = Math.max(...dailyVisitors.map(d => d.count), 1);
    const maxOutlet = Math.max(...perOutlet.map(o => o.count), 1);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/20">
                        <Eye className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Analitik Pengunjung</h1>
                        <p className="text-sm text-zinc-500 font-medium">Pantau trafik pengunjung harian katalog Anda</p>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    Update
                </button>
            </div>

            {/* Filters */}
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
                            <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-bold text-zinc-900 focus:outline-none" />
                    <span className="text-zinc-300 font-bold">/</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-bold text-zinc-900 focus:outline-none" />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard title="Hari Ini" value={summary.todayVisitors} icon={Eye} color="primary" subtitle="Unique hari ini" isLoading={isLoading} />
                <SummaryCard title="Total" value={summary.totalVisitors} icon={Users} color="emerald" subtitle="Sepanjang waktu" isLoading={isLoading} />
                <SummaryCard title="Rata-Rata" value={dailyVisitors.length > 0 ? Math.round(dailyVisitors.reduce((s, d) => s + d.count, 0) / dailyVisitors.length) : 0} icon={TrendingUp} color="amber" subtitle="Per hari aktif" isLoading={isLoading} />
                <SummaryCard title="Kota Aktif" value={locations.length} icon={MapPin} color="rose" subtitle="Lokasi terdeteksi" isLoading={isLoading} />
            </div>

            {/* Charts Row */}
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Daily Visitor Chart */}
                <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">Tren Pengunjung Harian</h3>
                            <p className="text-sm text-zinc-500 font-medium mt-1">Pengunjung unik per hari</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-primary-500" />
                            <span className="text-xs font-bold text-zinc-600">Visitors</span>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex h-72 items-center justify-center">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                        </div>
                    ) : dailyVisitors.length === 0 ? (
                        <div className="flex h-72 items-center justify-center rounded-2xl bg-zinc-50 border border-dashed border-zinc-200">
                            <div className="text-center">
                                <BarChart3 className="mx-auto mb-3 h-12 w-12 text-zinc-300" />
                                <p className="text-sm font-bold text-zinc-500">Belum ada data pengunjung</p>
                                <p className="text-xs text-zinc-400 mt-1">Bagikan link katalog Anda untuk mulai tracking</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-72 items-end justify-between gap-2 px-1">
                            {dailyVisitors.map((day) => (
                                <div key={day.visitDate} className="flex flex-1 flex-col items-center gap-3 group">
                                    <div className="relative w-full flex flex-col items-center justify-end h-[220px]">
                                        <div
                                            className="w-full max-w-[36px] rounded-xl bg-gradient-to-t from-primary-600 to-primary-400 transition-all duration-500 group-hover:scale-x-110 group-hover:shadow-lg group-hover:shadow-primary-500/20"
                                            style={{ height: `${Math.max((day.count / maxDaily) * 100, 6)}%` }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap z-10">
                                                {day.count} pengunjung
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider transition-colors group-hover:text-primary-600 whitespace-nowrap">
                                        {formatShortDate(day.visitDate)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Per-Outlet Breakdown */}
                <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-zinc-900 tracking-tight">Per Outlet</h3>
                        <p className="text-sm text-zinc-500 font-medium mt-1">Distribusi pengunjung tiap toko</p>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-zinc-50" />
                            ))}
                        </div>
                    ) : perOutlet.length === 0 ? (
                        <div className="flex h-48 items-center justify-center rounded-2xl bg-zinc-50 border border-dashed border-zinc-200">
                            <div className="text-center p-6">
                                <Store className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                                <p className="text-sm font-bold text-zinc-500">Belum ada data</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {perOutlet.sort((a, b) => b.count - a.count).map((outlet, index) => (
                                <div key={outlet.outletId} className="flex flex-col gap-2 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-xs font-black text-primary-600 border border-primary-100 transition-colors group-hover:bg-primary-500 group-hover:text-white">
                                                #{index + 1}
                                            </div>
                                            <span className="text-sm font-bold text-zinc-800 line-clamp-1">{outlet.outletName}</span>
                                        </div>
                                        <span className="text-xs font-black text-zinc-500 transition-colors group-hover:text-primary-600">
                                            {outlet.count} <span className="text-[10px] uppercase">views</span>
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                                        <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-700" style={{ width: `${(outlet.count / maxOutlet) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Location Breakdown */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-zinc-900 tracking-tight">Asal Pengunjung</h3>
                        <p className="text-sm text-zinc-500 font-medium mt-1">Breakdown lokasi berdasarkan kota</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-zinc-50" />
                        ))}
                    </div>
                ) : locations.length === 0 ? (
                    <div className="flex h-48 items-center justify-center rounded-2xl bg-zinc-50 border border-dashed border-zinc-200">
                        <div className="text-center p-6">
                            <MapPin className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                            <p className="text-sm font-bold text-zinc-500">Data lokasi akan muncul setelah deploy ke Vercel</p>
                            <p className="text-xs text-zinc-400 mt-1">Geo headers hanya tersedia di production</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {locations.slice(0, 12).map((loc, index) => (
                            <div key={`${loc.city}-${loc.country}-${index}`} className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 hover:border-primary-100 hover:bg-primary-50/30 transition-all group">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-sm font-black text-zinc-500 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors shrink-0">
                                    #{index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-zinc-900 truncate">{loc.city}</p>
                                    <p className="text-[11px] text-zinc-400 font-medium">{loc.region ? `${loc.region}, ` : ""}{loc.country}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-black text-primary-600">{loc.count}</p>
                                    <p className="text-[10px] text-zinc-400 uppercase font-bold">views</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function SummaryCard({ title, value, icon: Icon, color, subtitle, isLoading }: { title: string; value: number; icon: React.ElementType; color: string; subtitle: string; isLoading: boolean }) {
    const colorMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
        primary: { bg: "bg-primary-50", text: "text-primary-600", border: "border-primary-100", dot: "bg-primary-500" },
        emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", dot: "bg-emerald-500" },
        amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", dot: "bg-amber-500" },
        rose: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", dot: "bg-rose-500" },
    };
    const c = colorMap[color] || colorMap.primary;

    return (
        <div className="group rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">{title}</span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${c.bg} ${c.text} border ${c.border} transition-transform group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div className="mt-6">
                {isLoading ? (
                    <div className="h-8 w-3/4 animate-pulse rounded-lg bg-zinc-100" />
                ) : (
                    <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{value}</h3>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${c.dot} animate-pulse`} />
                    <p className="text-xs font-bold text-zinc-500">{subtitle}</p>
                </div>
            </div>
        </div>
    );
}
