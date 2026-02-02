"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Save, Loader2 } from "lucide-react";
import { createProduct } from "../actions";

export default function NewProductPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const outletId = searchParams.get("outletId");

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        barcode: "",
        price: "",
        costPrice: "",
        stock: "",
        category: "",
        trackStock: true,
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!outletId) {
            alert("Outlet ID missing. Please return to products page.");
            return;
        }

        setLoading(true);

        try {
            const res = await createProduct({
                outletId: outletId,
                name: formData.name,
                sku: formData.sku,
                barcode: formData.barcode,
                price: formData.price,
                costPrice: formData.costPrice,
                stock: formData.stock ? parseInt(formData.stock) : 0,
                trackStock: formData.trackStock,
                categoryId: formData.category || undefined, // TODO: add category selection
            });

            if (res.error) {
                alert(`Gagal membuat produk: ${res.error}`);
            } else {
                router.push("/dashboard/products");
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to create product:", error);
            alert("Terjadi kesalahan saat menyimpan produk.");
        } finally {
            setLoading(false);
        }
    };

    if (!outletId) {
        return (
            <div className="p-8 text-center text-red-500">
                Outlet ID is missing. Please go back to the products list.
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/products"
                    className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">
                        Tambah Produk Baru
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Isi informasi produk di bawah ini
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6"
            >
                {/* Product Image Placeholder */}
                <div className="flex flex-col items-center gap-3">
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50">
                        <Package className="h-10 w-10 text-zinc-300" />
                    </div>
                    <button
                        type="button"
                        className="text-sm font-medium text-primary-500 hover:text-primary-600"
                    >
                        Upload Gambar
                    </button>
                    <p className="text-xs text-zinc-400">Todo: Implement Image Upload</p>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-zinc-900">
                        Informasi Dasar
                    </h3>

                    <div>
                        <label
                            htmlFor="name"
                            className="mb-1.5 block text-sm font-medium text-zinc-700"
                        >
                            Nama Produk <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Contoh: Kopi Susu Gula Aren"
                            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="sku"
                                className="mb-1.5 block text-sm font-medium text-zinc-700"
                            >
                                SKU
                            </label>
                            <input
                                id="sku"
                                name="sku"
                                type="text"
                                value={formData.sku}
                                onChange={handleChange}
                                placeholder="SKU-001"
                                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="barcode"
                                className="mb-1.5 block text-sm font-medium text-zinc-700"
                            >
                                Barcode
                            </label>
                            <input
                                id="barcode"
                                name="barcode"
                                type="text"
                                value={formData.barcode}
                                onChange={handleChange}
                                placeholder="8991234567890"
                                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4 border-t border-zinc-200 pt-6">
                    <h3 className="text-sm font-medium text-zinc-900">
                        Harga & Stok
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="price"
                                className="mb-1.5 block text-sm font-medium text-zinc-700"
                            >
                                Harga Jual <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                                    Rp
                                </span>
                                <input
                                    id="price"
                                    name="price"
                                    type="number"
                                    required
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                />
                            </div>
                        </div>
                        <div>
                            <label
                                htmlFor="costPrice"
                                className="mb-1.5 block text-sm font-medium text-zinc-700"
                            >
                                Harga Modal
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                                    Rp
                                </span>
                                <input
                                    id="costPrice"
                                    name="costPrice"
                                    type="number"
                                    value={formData.costPrice}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="stock"
                                className="mb-1.5 block text-sm font-medium text-zinc-700"
                            >
                                Stok Awal
                            </label>
                            <input
                                id="stock"
                                name="stock"
                                type="number"
                                value={formData.stock}
                                onChange={handleChange}
                                placeholder="0"
                                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                        </div>
                        <div className="flex items-end">
                            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5">
                                <input
                                    type="checkbox"
                                    name="trackStock"
                                    checked={formData.trackStock}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-zinc-300 text-primary-500 focus:ring-primary-500"
                                />
                                <span className="text-sm text-zinc-700">
                                    Lacak Stok
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
                    <Link
                        href="/dashboard/products"
                        className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-secondary-500 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-secondary-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Simpan Produk
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
