"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Truck,
    Pencil,
    Trash2,
    Calendar,
    Filter,
    FileText,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { getOutlets } from "@/actions/outlets";
import { getPurchaseOrders } from "@/actions/purchase-orders";
import Link from "next/link";

interface PurchaseOrder {
    id: string;
    invoiceNumber: string;
    status: "draft" | "ordered" | "received" | "cancelled";
    supplier: { name: string };
    totalAmount: number;
    orderDate: Date;
    items: { length: number };
}

interface Outlet {
    id: string;
    name: string;
}

export default function PurchaseOrdersPage() {
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOutletId, setSelectedOutletId] = useState<string>("");

    // Fetch outlets
    useEffect(() => {
        const loadOutlets = async () => {
            const data = await getOutlets();
            setOutlets(data);
            if (data.length > 0) setSelectedOutletId(data[0].id);
        };
        loadOutlets();
    }, []);

    // Fetch orders
    useEffect(() => {
        if (!selectedOutletId) return;

        const loadOrders = async () => {
            setIsLoading(true);
            const res = await getPurchaseOrders(selectedOutletId);
            if (res.data) {
                setPurchaseOrders(res.data as any);
            }
            setIsLoading(false);
        };
        loadOrders();
    }, [selectedOutletId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "draft": return "bg-gray-100 text-gray-700 border-gray-200";
            case "ordered": return "bg-blue-100 text-blue-700 border-blue-200";
            case "received": return "bg-green-100 text-green-700 border-green-200";
            case "cancelled": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const StatusIcon = ({ status }: { status: string }) => {
        switch (status) {
            case "received": return <CheckCircle2 className="h-3 w-3 mr-1" />;
            case "cancelled": return <AlertCircle className="h-3 w-3 mr-1" />;
            default: return null;
        }
    };

    const filteredPOs = purchaseOrders.filter(po =>
        po.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        Purchase Orders
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Kelola pembelian stok dari supplier
                    </p>
                </div>
                <Link
                    href="/dashboard/purchase-orders/create"
                    className={`inline-flex items-center justify-center gap-2 rounded-lg bg-secondary-500 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-secondary-600 ${!selectedOutletId ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    <Plus className="h-4 w-4" />
                    Buat Pesanan Baru
                </Link>
            </div>

            {/* Outlet Selector & Search */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <select
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none min-w-[200px]"
                    disabled={outlets.length === 0}
                >
                    {outlets.map((outlet) => (
                        <option key={outlet.id} value={outlet.id}>
                            {outlet.name}
                        </option>
                    ))}
                </select>

                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Cari No. Invoice atau Supplier..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                </div>
            ) : filteredPOs.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
                    <h3 className="text-lg font-medium text-zinc-900">Belum ada Purchase Order</h3>
                    <p className="text-zinc-500 max-w-sm mx-auto mt-2">
                        Mulai buat pesanan pembelian ke supplier untuk menambah stok inventaris Anda.
                    </p>
                    <Link
                        href="/dashboard/purchase-orders/create"
                        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                        <Plus className="h-4 w-4" />
                        Buat Pesanan Pertama
                    </Link>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <table className="w-full">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Invoice / Tanggal</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Supplier</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {filteredPOs.map((po) => (
                                <tr key={po.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-zinc-900 flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-zinc-400" />
                                                {po.invoiceNumber}
                                            </span>
                                            <span className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(po.orderDate).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric"
                                                })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs ring-2 ring-white">
                                                {po.supplier.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-zinc-900">{po.supplier.name}</div>
                                                <div className="text-xs text-zinc-500">{po.items.length} Barang</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(po.status)} capitalize`}>
                                            <StatusIcon status={po.status} />
                                            {po.status === 'received' ? 'Diterima' : po.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="text-sm font-bold text-zinc-900">
                                            Rp {po.totalAmount.toLocaleString("id-ID")}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <Link
                                            href={`/dashboard/purchase-orders/${po.id}`}
                                            className="text-primary-600 hover:text-primary-700 font-medium text-sm hover:underline"
                                        >
                                            Detail
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
