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
    MessageCircle,
    ShoppingCart,
    Flame,
    ArrowUpRight,
    Clock,
    UserPlus,
    RotateCcw,
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

interface HotProduct {
    productId: string | null;
    name: string | null;
    viewCount: number;
}

interface PeakHour {
    hour: number;
    count: number;
}

interface Loyalty {
    new: number;
    returning: number;
    total: number;
}

interface Outlet {
    id: string;
    name: string;
}

interface Summary {
    totalVisitors: number;
    todayVisitors: number;
    totalWaClicks: number;
    totalAddToCart: number;
    conversionRate: number;
}

export default function VisitorAnalyticsPage() {
    const [dailyVisitors, setDailyVisitors] = useState<DailyVisitor[]>([]);
    const [perOutlet, setPerOutlet] = useState<OutletVisitor[]>([]);
    const [locations, setLocations] = useState<LocationVisitor[]>([]);
    const [hotProducts, setHotProducts] = useState<HotProduct[]>([]);
    const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
    const [loyalty, setLoyalty] = useState<Loyalty>({ new: 0, returning: 0, total: 0 });
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [summary, setSummary] = useState<Summary>({
        totalVisitors: 0,
        todayVisitors: 0,
        totalWaClicks: 0,
        totalAddToCart: 0,
        conversionRate: 0
    });
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
                setHotProducts(data.hotProducts || []);
                setPeakHours(data.peakHours || []);
                setLoyalty(data.loyalty || { new: 0, returning: 0, total: 0 });
                setOutlets(data.outlets || []);
                setSummary(data.summary || {
                    totalVisitors: 0,
                    todayVisitors: 0,
                    totalWaClicks: 0,
                    totalAddToCart: 0,
                    conversionRate: 0
                });
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
    const maxHotProduct = Math.max(...hotProducts.map(p => p.viewCount), 1);
    const maxHour = Math.max(...peakHours.map(h => h.count), 1);

    const returningRate = loyalty.total > 0 ? (loyalty.returning / loyalty.total) * 100 : 0;

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
                        <p className="text-sm text-zinc-500 font-medium">Pantau trafik dan konversi katalog Anda</p>
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
                <SummaryCard title="Conversion Rate" value={`${summary.conversionRate}%`} icon={ArrowUpRight} color="emerald" subtitle="Visit to WA Click" isLoading={isLoading} />
                <SummaryCard title="Loyalty" value={`${returningRate.toFixed(1)}%`} icon={RotateCcw} color="rose" subtitle="Returning Visitors" isLoading={isLoading} />
                <SummaryCard title="WhatsApp Clicks" value={summary.totalWaClicks} icon={MessageCircle} color="primary" subtitle="Niat belanja" isLoading={isLoading} />
                <SummaryCard title="Add to Cart" value={summary.totalAddToCart} icon={ShoppingCart} color="amber" subtitle="Produk dipilih" isLoading={isLoading} />
            </div>

            {/* Main Content Grid */}
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

                {/* Hot Products (Hot Clicks) */}
                <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                            <Flame className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">Hot Products</h3>
                            <p className="text-sm text-zinc-500 font-medium mt-1">Produk paling sering dilihat</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-zinc-50" />
                            ))}
                        </div>
                    ) : hotProducts.length === 0 ? (
                        <div className="flex h-48 items-center justify-center rounded-2xl bg-zinc-50 border border-dashed border-zinc-200">
                            <div className="text-center p-6">
                                <Package className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                                <p className="text-sm font-bold text-zinc-500">Belum ada data produk</p>
                            </div>
                        </div>
                    ) : (
                        <div className="max-h-[380px] overflow-y-auto pr-2 slim-scrollbar">
                            <div className="space-y-4">
                                {hotProducts.map((product, index) => (
                                    <div key={product.productId || index} className="flex flex-col gap-1.5 group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-xs font-black text-zinc-400 w-4">#{index + 1}</span>
                                                <span className="text-sm font-bold text-zinc-800 truncate">{product.name || "Unknown Product"}</span>
                                            </div>
                                            <span className="text-xs font-black text-primary-600 whitespace-nowrap">{product.viewCount} views</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                                            <div
                                                className="h-full rounded-full bg-orange-500 transition-all duration-700"
                                                style={{ width: `${(product.viewCount / maxHotProduct) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Middle Row: Peak Hours & Loyalty Details */}
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Peak Hours Chart */}
                <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-zinc-900 tracking-tight">Peak Hours Insight</h3>
                                <p className="text-sm text-zinc-500 font-medium mt-1">Distribusi trafik berdasarkan jam (WIB)</p>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex h-48 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                        </div>
                    ) : (
                        <div className="flex h-48 items-end gap-1 px-1">
                            {peakHours.map((h) => (
                                <div key={h.hour} className="flex flex-1 flex-col items-center gap-2 group">
                                    <div className="relative w-full flex flex-col items-center justify-end h-full">
                                        <div
                                            className="w-full rounded-t-lg bg-indigo-500/20 group-hover:bg-indigo-500 transition-all duration-300"
                                            style={{ height: `${Math.max((h.count / maxHour) * 100, 4)}%` }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap z-10 shadow-xl">
                                                Jam {h.hour}:00: {h.count} visit
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-bold text-zinc-400 group-hover:text-indigo-600">
                                        {h.hour}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Loyalty Breakdown */}
                <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">Loyalitas Pengunjung</h3>
                            <p className="text-sm text-zinc-500 font-medium mt-1">New vs Returning Visitors</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-6">
                            <div className="h-12 w-full animate-pulse rounded-xl bg-zinc-50" />
                            <div className="h-12 w-full animate-pulse rounded-xl bg-zinc-50" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <UserPlus className="h-3.5 w-3.5 text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">New</span>
                                    </div>
                                    <p className="text-2xl font-black text-zinc-900">{loyalty.new}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <RotateCcw className="h-3.5 w-3.5 text-primary-500" />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Returning</span>
                                    </div>
                                    <p className="text-2xl font-black text-zinc-900">{loyalty.returning}</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-zinc-500">Loyalty Index</span>
                                    <span className="text-primary-600">{returningRate.toFixed(1)}%</span>
                                </div>
                                <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
                                    <div
                                        className="h-full rounded-full bg-primary-500 transition-all duration-1000"
                                        style={{ width: `${returningRate}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-400 font-medium leading-relaxed italic">
                                    Persentase pengunjung lama yang kembali melihat katalog mase dalam rentang waktu ini.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Cities & Outlets */}
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Cities */}
                <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">Asal Pengunjung</h3>
                            <p className="text-sm text-zinc-500 font-medium mt-1">Berdasarkan lokasi IP (Vercel Geo)</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-zinc-50" />
                            ))}
                        </div>
                    ) : locations.length === 0 ? (
                        <div className="flex h-32 items-center justify-center rounded-2xl bg-zinc-50 border border-dashed border-zinc-200">
                            <p className="text-sm font-bold text-zinc-500">Data lokasi hanya muncul di production</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {locations.slice(0, 8).map((loc, index) => (
                                <div key={`${loc.city}-${index}`} className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 hover:border-primary-100 hover:bg-primary-50/30 transition-all group">
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

                {/* Per-Outlet breakdown */}
                <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Store className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">Per-Outlet</h3>
                            <p className="text-sm text-zinc-500 font-medium mt-1">Distribusi pengunjung</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-zinc-50" />
                            ))}
                        </div>
                    ) : perOutlet.length === 0 ? (
                        <div className="flex h-32 items-center justify-center rounded-2xl bg-zinc-50 border border-dashed border-zinc-200">
                            <p className="text-sm font-bold text-zinc-500">Belum ada data</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {perOutlet.sort((a, b) => b.count - a.count).map((outlet, index) => (
                                <div key={outlet.outletId} className="flex flex-col gap-2 group">
                                    <div className="flex items-center justify-between font-bold text-sm">
                                        <span className="text-zinc-800 truncate max-w-[150px]">{outlet.outletName}</span>
                                        <span className="text-zinc-500">{outlet.count} views</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                                        <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${(outlet.count / maxOutlet) * 100}%` }} />
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

function SummaryCard({ title, value, icon: Icon, color, subtitle, isLoading }: { title: string; value: string | number; icon: React.ElementType; color: string; subtitle: string; isLoading: boolean }) {
    const colorMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
        primary: { bg: "bg-primary-50", text: "text-primary-600", border: "border-primary-100", dot: "bg-primary-500" },
        emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", dot: "bg-emerald-500" },
        amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", dot: "bg-amber-500" },
        rose: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", dot: "bg-rose-500" },
        zinc: { bg: "bg-zinc-50", text: "text-zinc-600", border: "border-zinc-100", dot: "bg-zinc-500" },
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

function Package(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
        </svg>
    );
}
