"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Plus,
    Search,
    Package,
    Pencil,
    Trash2,
    Filter,
} from "lucide-react";
import { getProducts, deleteProduct } from "./actions";
import { getOutlets } from "@/actions/outlets";

// Basic types based on schema
interface Product {
    id: string;
    name: string;
    sku: string | null;
    price: string;
    stock: number;
    isActive: boolean | null;
    category?: { name: string } | null;
}

export default function ProductsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOutletId, setSelectedOutletId] = useState("");
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Outlets to know which context we are in
            const outlets = await getOutlets();
            if (outlets.length > 0) {
                // Default to first outlet (system default often)
                const defaultOutlet = outlets[0].id;
                setSelectedOutletId(defaultOutlet);

                // 2. Fetch Products
                await fetchProducts(defaultOutlet);
            } else {
                // If no outlets, maybe try to fetch products globally if allowed? 
                // Or just show empty.
                setProducts([]);
            }
        } catch (error) {
            console.error("Failed to load initial data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProducts = async (outletId: string) => {
        const res = await getProducts(outletId);
        if (res.data) {
            setProducts(res.data);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus produk ini?")) return;
        setIsDeleting(id);
        try {
            const res = await deleteProduct(id);
            if (res.success) {
                // Remove from state or reload
                setProducts(prev => prev.filter(p => p.id !== id));
            } else {
                alert("Gagal menghapus produk: " + res.error);
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat menghapus");
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const formatPrice = (price: string) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(parseInt(price));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        Produk
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Kelola semua produk dan stok toko Anda
                    </p>
                </div>
                <Link
                    href={`/dashboard/products/new?outletId=${selectedOutletId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary-500 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-secondary-600"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Produk
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Cari produk atau SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50">
                    <Filter className="h-4 w-4" />
                    Filter
                </button>
            </div>

            {/* Products Table */}
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-200 bg-zinc-50">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Produk
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    SKU
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Harga
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Stok
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-12 text-center text-sm text-zinc-500"
                                    >
                                        <Package className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                                        <p>Tidak ada produk ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="transition-colors hover:bg-zinc-50"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                                                    <Package className="h-5 w-5 text-primary-600" />
                                                </div>
                                                <span className="font-medium text-zinc-900">
                                                    {product.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-zinc-500">
                                            {product.sku || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900">
                                            {formatPrice(product.price)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm text-zinc-500">
                                            {product.stock}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${product.isActive
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {product.isActive ? "Aktif" : "Nonaktif"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/dashboard/products/${product.id}/edit`}
                                                    className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    disabled={isDeleting === product.id}
                                                    className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
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
