"use client";

import { useState, useEffect } from "react";
import {
    Package,
    Search,
    AlertTriangle,
    Plus,
    Minus,
    RefreshCw,
} from "lucide-react";

interface Product {
    id: string;
    name: string;
    sku: string | null;
    stock: number;
    trackStock: boolean;
    price: string;
    outletId: string;
}

interface Outlet {
    id: string;
    name: string;
}

interface StockAlert {
    total: number;
    critical: number;
    warning: number;
    products: {
        id: string;
        name: string;
        stock: number;
        outletName: string | null;
    }[];
}

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [alerts, setAlerts] = useState<StockAlert | null>(null);
    const [selectedOutletId, setSelectedOutletId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [adjustingId, setAdjustingId] = useState<string | null>(null);
    const [adjustmentAmounts, setAdjustmentAmounts] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchOutlets();
        fetchAlerts();
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [selectedOutletId]);

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

    const fetchInventory = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedOutletId) params.set("outletId", selectedOutletId);

            const res = await fetch(`/api/inventory?${params}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error("Failed to fetch inventory:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAlerts = async () => {
        try {
            const res = await fetch("/api/inventory/alerts");
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);
            }
        } catch (error) {
            console.error("Failed to fetch alerts:", error);
        }
    };

    const adjustStock = async (productId: string, adjustment: number) => {
        setAdjustingId(productId);
        const amount = adjustmentAmounts[productId] ?? 1;
        const finalAdjustment = adjustment * amount;

        try {
            const res = await fetch("/api/inventory", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId,
                    adjustment: finalAdjustment,
                    type: finalAdjustment > 0 ? "in" : "out",
                }),
            });

            if (res.ok) {
                fetchInventory();
                fetchAlerts();
                // Reset adjustment amount for this product
                setAdjustmentAmounts(prev => ({ ...prev, [productId]: 1 }));
            }
        } catch (error) {
            console.error("Failed to adjust stock:", error);
            alert("Gagal mengubah stok. Silakan coba lagi.");
        } finally {
            setAdjustingId(null);
        }
    };

    const getStockStatus = (stock: number) => {
        if (stock === 0)
            return { label: "Habis", color: "bg-red-100 text-red-700" };
        if (stock < 5)
            return { label: "Rendah", color: "bg-yellow-100 text-yellow-700" };
        return { label: "Aman", color: "bg-green-100 text-green-700" };
    };

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        Inventaris
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Kelola dan pantau stok produk
                    </p>
                </div>
                <button
                    onClick={() => {
                        fetchInventory();
                        fetchAlerts();
                    }}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Alerts Summary */}
            {alerts && alerts.total > 0 && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
                        <div>
                            <h3 className="font-medium text-yellow-800">
                                Peringatan Stok
                            </h3>
                            <p className="mt-1 text-sm text-yellow-700">
                                <span className="font-semibold">{alerts.critical}</span> produk habis,{" "}
                                <span className="font-semibold">{alerts.warning}</span> produk stok rendah
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <select
                    value={selectedOutletId}
                    onChange={(e) => setSelectedOutletId(e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-primary-500 focus:outline-none"
                >
                    <option value="">Semua Outlet</option>
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
                        placeholder="Cari produk..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>
            </div>

            {/* Inventory Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center">
                    <Package className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                    <p className="text-zinc-500">Belum ada produk</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-200 bg-zinc-50">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Produk
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Stok
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {filteredProducts.map((product) => {
                                const status = getStockStatus(product.stock);
                                return (
                                    <tr
                                        key={product.id}
                                        className="transition-colors hover:bg-zinc-50"
                                    >
                                        <td className="px-4 py-3">
                                            <div>
                                                <span className="font-medium text-zinc-900">
                                                    {product.name}
                                                </span>
                                                {product.sku && (
                                                    <p className="text-xs text-zinc-500">{product.sku}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-lg font-bold text-zinc-900">
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}
                                            >
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => adjustStock(product.id, -1)}
                                                    disabled={adjustingId === product.id || product.stock === 0}
                                                    className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                    title={`Kurangi ${(adjustmentAmounts[product.id] ?? 1)}`}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={adjustmentAmounts[product.id] ?? 1}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        setAdjustmentAmounts(prev => ({
                                                            ...prev,
                                                            [product.id]: isNaN(val) ? 1 : val
                                                        }));
                                                    }}
                                                    className="w-16 rounded-md border border-zinc-200 bg-white py-1 text-center text-sm font-medium text-zinc-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                                                />

                                                <button
                                                    onClick={() => adjustStock(product.id, 1)}
                                                    disabled={adjustingId === product.id}
                                                    className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                                                    title={`Tambah ${(adjustmentAmounts[product.id] ?? 1)}`}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
