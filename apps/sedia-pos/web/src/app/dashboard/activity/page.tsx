"use client";

import { useState, useEffect } from "react";
import {
    History,
    Search,
    Filter,
    Calendar,
    User,
    Box,
    ShoppingCart,
    Users,
    Store,
    RefreshCw,
    Package,
    ArrowRight,
    Activity,
    Edit2,
    Trash2,
    PlusCircle,
    Ban
} from "lucide-react";
import { useSearchParams } from "next/navigation";

interface ActivityLog {
    id: string;
    outletId: string;
    userId: string;
    userName: string;
    action: string;
    entityType: string;
    entityId: string;
    description: string;
    metadata: any;
    createdAt: string;
}

export default function ActivityLogPage() {
    const searchParams = useSearchParams();
    const outletId = searchParams.get("outletId");

    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [actionFilter, setActionFilter] = useState("ALL");

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const url = outletId
                ? `/api/activity-logs?outletId=${outletId}`
                : "/api/activity-logs";
            const res = await fetch(url);
            const data = await res.json();
            setLogs(data);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [outletId]);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.description.toLowerCase().includes(filter.toLowerCase()) ||
            log.userName.toLowerCase().includes(filter.toLowerCase());
        const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
        return matchesSearch && matchesAction;
    });

    const getEntityIcon = (type: string) => {
        switch (type) {
            case 'PRODUCT': return <Package className="h-4 w-4" />;
            case 'TRANSACTION': return <ShoppingCart className="h-4 w-4" />;
            case 'SHIFT': return <RefreshCw className="h-4 w-4" />;
            case 'EMPLOYEE': return <Users className="h-4 w-4" />;
            case 'OUTLET': return <Store className="h-4 w-4" />;
            default: return <Box className="h-4 w-4" />;
        }
    };

    const getActionStyle = (action: string) => {
        switch (action) {
            case 'CREATE': return {
                icon: PlusCircle,
                bg: "bg-green-100",
                text: "text-green-700",
                border: "border-green-200"
            };
            case 'UPDATE': return {
                icon: Edit2,
                bg: "bg-blue-100",
                text: "text-blue-700",
                border: "border-blue-200"
            };
            case 'DELETE': return {
                icon: Trash2,
                bg: "bg-red-100",
                text: "text-red-700",
                border: "border-red-200"
            };
            case 'VOID': return {
                icon: Ban,
                bg: "bg-orange-100",
                text: "text-orange-700",
                border: "border-orange-200"
            };
            default: return {
                icon: Activity,
                bg: "bg-zinc-100",
                text: "text-zinc-700",
                border: "border-zinc-200"
            };
        }
    };

    // Helper to group logs by date
    const groupLogsByDate = (logs: ActivityLog[]) => {
        const groups: { [key: string]: ActivityLog[] } = {};

        logs.forEach(log => {
            const date = new Date(log.createdAt);
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            let dateKey = date.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            if (date.toDateString() === today.toDateString()) {
                dateKey = "Hari Ini";
            } else if (date.toDateString() === yesterday.toDateString()) {
                dateKey = "Kemarin";
            }

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(log);
        });

        return groups;
    };

    const groupedLogs = groupLogsByDate(filteredLogs);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                            <History className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                                Audit Trail
                            </h1>
                            <p className="text-sm text-zinc-500 font-medium">
                                Rekam jejak aktivitas sistem
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={fetchLogs}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-600 transition-all hover:bg-zinc-50 hover:shadow-sm active:scale-95"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 rounded-3xl border border-zinc-200 bg-white p-2 shadow-sm">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Cari aktivitas atau user..."
                        className="w-full rounded-2xl border-0 bg-zinc-50 py-3 pl-10 pr-4 text-sm font-medium text-zinc-900 focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-zinc-400"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 px-2">
                    <Filter className="h-4 w-4 text-zinc-400" />
                    <div className="flex gap-2">
                        {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'VOID'].map((action) => (
                            <button
                                key={action}
                                onClick={() => setActionFilter(action)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${actionFilter === action
                                        ? 'bg-zinc-900 text-white shadow-md'
                                        : 'bg-white text-zinc-500 hover:bg-zinc-50 border border-zinc-100'
                                    }`}
                            >
                                {action === 'ALL' ? 'Semua' : action}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative pl-6 sm:pl-10 space-y-12 pb-12">
                {/* Vertical Loop Line */}
                <div className="absolute left-6 sm:left-10 top-4 bottom-0 w-px bg-zinc-200 -translate-x-1/2" />

                {isLoading ? (
                    <div className="flex flex-col gap-6 pt-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex gap-6 animate-pulse">
                                <div className="h-10 w-10 rounded-full bg-zinc-100 flex-shrink-0" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 w-1/4 bg-zinc-100 rounded" />
                                    <div className="h-24 w-full bg-zinc-50 rounded-2xl border border-zinc-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="relative pt-12 text-center z-10">
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-50 border border-dashed border-zinc-200 mb-4">
                            <History className="h-8 w-8 text-zinc-300" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900">Belum ada aktivitas</h3>
                        <p className="text-zinc-500">Aktivitas sistem akan muncul di sini</p>
                    </div>
                ) : (
                    Object.entries(groupedLogs).map(([date, groupLogs]) => (
                        <div key={date} className="relative z-10">
                            {/* Date Header */}
                            <div className="inline-flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-4 py-1.5 rounded-full mb-6">
                                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                                    {date}
                                </span>
                            </div>

                            <div className="space-y-6">
                                {groupLogs.map((log) => {
                                    const style = getActionStyle(log.action);
                                    const ActionIcon = style.icon;

                                    return (
                                        <div key={log.id} className="relative group">
                                            {/* Timeline Node */}
                                            <div className={`absolute -left-[40px] sm:-left-[56px] top-4 h-8 w-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${style.bg} ${style.text}`}>
                                                <ActionIcon className="h-3.5 w-3.5" />
                                            </div>

                                            {/* Content Card */}
                                            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-1 transition-all hover:shadow-md hover:border-zinc-200">
                                                <div className="flex flex-col sm:flex-row gap-4 p-5">
                                                    {/* Time & User */}
                                                    <div className="flex items-center gap-3 sm:w-48 sm:flex-shrink-0">
                                                        <div className="text-right">
                                                            <div className="text-sm font-bold text-zinc-900">
                                                                {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                                                                WIB
                                                            </div>
                                                        </div>
                                                        <div className="h-8 w-px bg-zinc-100" />
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-black">
                                                                {log.userName.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-zinc-900 line-clamp-1">
                                                                    {log.userName}
                                                                </div>
                                                                <div className="text-[10px] text-zinc-500">
                                                                    User
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}>
                                                                {log.action}
                                                            </span>
                                                            <span className="text-[10px] font-medium text-zinc-400">
                                                                via {log.entityType}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-zinc-700 font-medium leading-relaxed">
                                                            {log.description}
                                                        </p>
                                                    </div>

                                                    {/* Entity Icon (Desktop) */}
                                                    <div className="hidden sm:flex items-center justify-center h-10 w-10 rounded-2xl bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-600 transition-colors">
                                                        {getEntityIcon(log.entityType)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
