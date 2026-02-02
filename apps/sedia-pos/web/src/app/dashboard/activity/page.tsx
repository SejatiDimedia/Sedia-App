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
    ArrowRight
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

    const getActionBadge = (action: string) => {
        const baseClass = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
        switch (action) {
            case 'CREATE': return `${baseClass} bg-green-100 text-green-700`;
            case 'UPDATE': return `${baseClass} bg-blue-100 text-blue-700`;
            case 'DELETE': return `${baseClass} bg-red-100 text-red-700`;
            case 'VOID': return `${baseClass} bg-orange-100 text-orange-700`;
            default: return `${baseClass} bg-zinc-100 text-zinc-700`;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                            <History className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900">
                                Audit Trail
                            </h1>
                            <p className="text-sm text-zinc-500">
                                Riwayat semua aktivitas dan perubahan sistem
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={fetchLogs}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Cari aktivitas atau nama user..."
                        className="w-full rounded-xl border border-zinc-200 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-zinc-400" />
                    <select
                        className="rounded-xl border border-zinc-200 py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                    >
                        <option value="ALL">Semua Aksi</option>
                        <option value="CREATE">Tambah</option>
                        <option value="UPDATE">Ubah</option>
                        <option value="DELETE">Hapus</option>
                        <option value="VOID">Batal/Void</option>
                    </select>
                </div>
            </div>

            {/* Logs List */}
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Waktu</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Pengguna</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Aksi</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Deskripsi</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Entitas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4">
                                            <div className="h-4 w-full bg-zinc-100 rounded"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        Tidak ada catatan aktivitas yang ditemukan
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-zinc-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-zinc-900 font-medium">
                                                {new Date(log.createdAt).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <div className="text-[11px] text-zinc-500">
                                                {new Date(log.createdAt).toLocaleTimeString('id-ID', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-bold">
                                                    {log.userName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-zinc-700">{log.userName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-zinc-700 line-clamp-1 group-hover:line-clamp-none transition-all">
                                                {log.description}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-zinc-500">
                                                {getEntityIcon(log.entityType)}
                                                <span className="text-xs">{log.entityType}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
