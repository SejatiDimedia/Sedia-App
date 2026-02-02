"use client";

import { useState, useEffect } from "react";
import { Plus, History, Calendar, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface StockOpname {
    id: string;
    date: string;
    status: string;
    notes: string | null;
    createdAt: string;
}

interface Outlet {
    id: string;
    name: string;
}

export default function StockOpnameListPage() {
    const [opnames, setOpnames] = useState<StockOpname[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutletId, setSelectedOutletId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchOutlets();
    }, []);

    useEffect(() => {
        if (selectedOutletId) {
            fetchOpnames();
        }
    }, [selectedOutletId]);

    const fetchOutlets = async () => {
        try {
            const res = await fetch("/api/outlets");
            if (res.ok) {
                const data = await res.json();
                setOutlets(data);
                if (data.length > 0) {
                    setSelectedOutletId(data[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch outlets:", error);
        }
    };

    const fetchOpnames = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/inventory/opname?outletId=${selectedOutletId}`);
            if (res.ok) {
                const data = await res.json();
                setOpnames(data);
            }
        } catch (error) {
            console.error("Failed to fetch opnames:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Stock Opname</h1>
                    <p className="text-sm text-zinc-500">Riwayat penyesuaian stok fisik</p>
                </div>
                <Link
                    href="/dashboard/inventory/opname/new"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                >
                    <Plus className="h-4 w-4" />
                    Opname Baru
                </Link>
            </div>

            {/* Outlet Selector */}
            <div className="w-full sm:w-64">
                <select
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none"
                    disabled={outlets.length === 0}
                >
                    {outlets.map((outlet) => (
                        <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
            ) : opnames.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center">
                    <History className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                    <p className="text-zinc-500">Belum ada riwayat stock opname</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-200 bg-zinc-50">
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Catatan</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {opnames.map((opname) => (
                                <tr key={opname.id} className="hover:bg-zinc-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm text-zinc-900">
                                            <Calendar className="h-4 w-4 text-zinc-400" />
                                            {formatDate(opname.date)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${opname.status === 'completed'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {opname.status === 'completed' ? (
                                                <CheckCircle className="h-3 w-3" />
                                            ) : (
                                                <AlertCircle className="h-3 w-3" />
                                            )}
                                            {opname.status === 'completed' ? 'Selesai' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-600">
                                        {opname.notes || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        <Link
                                            href={`/dashboard/inventory/opname/${opname.id}`}
                                            className="text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            {opname.status === 'pending' ? 'Lanjutkan' : 'Detail'}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
