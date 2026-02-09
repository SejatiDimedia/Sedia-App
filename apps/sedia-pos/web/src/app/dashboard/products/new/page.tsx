"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Package,
    Save,
    Loader2,
    Plus,
    Trash2,
    Image as ImageIcon,
    Info,
    Tag,
    Banknote,
    Box,
    Layers,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react";
import { createProduct, getCategories } from "../actions";
import { toast } from "react-hot-toast";
import { ImageUpload } from "@/components/dashboard/ImageUpload";

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
        categoryId: "",
        trackStock: true,
        imageUrl: "",
        variants: [] as { name: string; type: string; priceAdjustment: string; stock: number; isActive: boolean }[],
    });
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        if (outletId) {
            fetchCategories();
        }
    }, [outletId]);

    const fetchCategories = async () => {
        const res = await getCategories();
        if (res.data) setCategories(res.data);
    };

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
            toast.error("Outlet ID missing. Please return to products page.");
            return;
        }

        if (!formData.name || !formData.price) {
            toast.error("Nama dan Harga Jual wajib diisi");
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
                categoryId: formData.categoryId || undefined,
                imageUrl: formData.imageUrl || undefined,
                variants: formData.variants,
            });

            if (res.error) {
                toast.error(`Gagal membuat produk: ${res.error}`);
            } else {
                toast.success("Produk berhasil dibuat");
                router.push("/dashboard/products");
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to create product:", error);
            toast.error("Terjadi kesalahan saat menyimpan produk.");
        } finally {
            setLoading(false);
        }
    };

    if (!outletId) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 rounded-full bg-rose-50 p-4">
                    <AlertCircle className="h-8 w-8 text-rose-500" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">Outlet Tidak Ditemukan</h2>
                <p className="mt-2 text-zinc-500">Silakan kembali ke daftar produk dan pilih outlet terlebih dahulu.</p>
                <Link href="/dashboard/products" className="mt-6 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800">
                    Kembali ke Produk
                </Link>
            </div>
        );
    }

    return (
        <div className="pb-20">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 -mx-4 mb-8 bg-zinc-50/80 px-4 py-4 backdrop-blur-md sm:-mx-8 sm:px-8">
                <div className="mx-auto max-w-5xl">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/dashboard/products"
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-all hover:bg-zinc-50 hover:text-zinc-900"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-black text-zinc-900 sm:text-2xl">
                                    Tambah Produk
                                </h1>
                                <p className="text-xs text-zinc-500 sm:text-sm">
                                    Tambahkan item baru ke katalog toko Anda
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/dashboard/products"
                                className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-600 transition-all hover:bg-zinc-50"
                            >
                                Batal
                            </Link>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-primary-500/40 disabled:opacity-50"
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
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-5xl">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left Column: Media & Information */}
                    <div className="space-y-8 lg:col-span-2">
                        {/* Basic Info Section */}
                        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center gap-3 border-b border-zinc-50 pb-4">
                                <div className="rounded-lg bg-primary-50 p-2">
                                    <Info className="h-5 w-5 text-primary-600" />
                                </div>
                                <h3 className="font-bold text-zinc-900 text-left">Informasi Produk</h3>
                            </div>

                            <div className="space-y-6 text-left">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-zinc-700">
                                            Nama Produk <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Contoh: Kopi Susu Gula Aren"
                                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="categoryId" className="mb-1.5 block text-sm font-semibold text-zinc-700">
                                            Kategori
                                        </label>
                                        <div className="relative">
                                            <Tag className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                            <select
                                                id="categoryId"
                                                name="categoryId"
                                                value={formData.categoryId}
                                                onChange={handleChange}
                                                className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-11 pr-10 text-sm text-zinc-900 transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10"
                                            >
                                                <option value="">Pilih Kategori</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="sku" className="mb-1.5 block text-sm font-semibold text-zinc-700">
                                            SKU (Stock Keeping Unit)
                                        </label>
                                        <input
                                            id="sku"
                                            name="sku"
                                            type="text"
                                            value={formData.sku}
                                            onChange={handleChange}
                                            placeholder="Misal: KOP-001"
                                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Section */}
                        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center gap-3 border-b border-zinc-50 pb-4">
                                <div className="rounded-lg bg-secondary-50 p-2">
                                    <Banknote className="h-5 w-5 text-secondary-600" />
                                </div>
                                <h3 className="font-bold text-zinc-900 text-left">Harga & Inventori</h3>
                            </div>

                            <div className="space-y-6 text-left">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="price" className="mb-1.5 block text-sm font-semibold text-zinc-700">
                                            Harga Jual <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
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
                                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-12 pr-4 text-sm font-bold text-zinc-900 transition-all focus:border-secondary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-secondary-500/10"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="costPrice" className="mb-1.5 block text-sm font-semibold text-zinc-700">
                                            Harga Modal
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                                                Rp
                                            </span>
                                            <input
                                                id="costPrice"
                                                name="costPrice"
                                                type="number"
                                                value={formData.costPrice}
                                                onChange={handleChange}
                                                placeholder="0"
                                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-12 pr-4 text-sm text-zinc-900 transition-all focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="stock" className="mb-1.5 block text-sm font-semibold text-zinc-700">
                                            Stok Tersedia
                                        </label>
                                        <div className="relative">
                                            <Box className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                            <input
                                                id="stock"
                                                name="stock"
                                                type="number"
                                                value={formData.stock}
                                                onChange={handleChange}
                                                placeholder="0"
                                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-11 pr-4 text-sm text-zinc-900 transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-end">
                                        <label className="flex h-12 w-full cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 transition-all hover:bg-zinc-100">
                                            <div className="flex items-center gap-3">
                                                <Layers className="h-4 w-4 text-zinc-400" />
                                                <span className="text-sm font-medium text-zinc-700">Lacak Inventori</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                name="trackStock"
                                                checked={formData.trackStock}
                                                onChange={handleChange}
                                                className="h-5 w-5 rounded-md border-zinc-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Variants Section */}
                        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center justify-between border-b border-zinc-50 pb-4">
                                <div className="flex items-center gap-3 text-left leading-none">
                                    <div className="rounded-lg bg-primary-50 p-2">
                                        <Plus className="h-5 w-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900">Varian Produk</h3>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">Misalnya: Ukuran, Warna, atau Topping</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        variants: [...prev.variants, { name: "", type: "size", priceAdjustment: "0", stock: 0, isActive: true }]
                                    }))}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-primary-700"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Tambah Varian
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.variants.map((variant, index) => (
                                    <div key={index} className="group relative rounded-2xl border border-zinc-100 bg-zinc-50/30 p-5 transition-all hover:border-purple-200 hover:bg-white text-left">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newVariants = formData.variants.filter((_, i) => i !== index);
                                                setFormData({ ...formData, variants: newVariants });
                                            }}
                                            className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-rose-100 text-rose-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                            <div className="sm:col-span-1">
                                                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-zinc-400">Nama Varian</label>
                                                <input
                                                    type="text"
                                                    value={variant.name}
                                                    placeholder="Contoh: XL"
                                                    onChange={(e) => {
                                                        const newVariants = [...formData.variants];
                                                        newVariants[index].name = e.target.value;
                                                        setFormData({ ...formData, variants: newVariants });
                                                    }}
                                                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition-all focus:border-primary-500 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-zinc-400">Tipe</label>
                                                <select
                                                    value={variant.type}
                                                    onChange={(e) => {
                                                        const newVariants = [...formData.variants];
                                                        newVariants[index].type = e.target.value;
                                                        setFormData({ ...formData, variants: newVariants });
                                                    }}
                                                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition-all focus:border-primary-500 focus:outline-none"
                                                >
                                                    <option value="size">Ukuran</option>
                                                    <option value="color">Warna</option>
                                                    <option value="option">Opsi</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-zinc-400">Harga (±)</label>
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">Rp</span>
                                                    <input
                                                        type="number"
                                                        value={variant.priceAdjustment}
                                                        onChange={(e) => {
                                                            const newVariants = [...formData.variants];
                                                            newVariants[index].priceAdjustment = e.target.value;
                                                            setFormData({ ...formData, variants: newVariants });
                                                        }}
                                                        className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-7 pr-3 text-sm transition-all focus:border-primary-500 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-zinc-400">Stok Varian</label>
                                                <input
                                                    type="number"
                                                    value={variant.stock}
                                                    onChange={(e) => {
                                                        const newVariants = [...formData.variants];
                                                        newVariants[index].stock = parseInt(e.target.value) || 0;
                                                        setFormData({ ...formData, variants: newVariants });
                                                    }}
                                                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition-all focus:border-primary-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {formData.variants.length === 0 && (
                                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-100 py-12 text-center">
                                        <div className="mb-3 rounded-full bg-zinc-50 p-3">
                                            <Plus className="h-6 w-6 text-zinc-300" />
                                        </div>
                                        <p className="text-sm font-medium text-zinc-400">Belum ada varian ditambahkan</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Preview & Status */}
                    <div className="space-y-8">
                        {/* Image Section */}
                        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center gap-3 border-b border-zinc-50 pb-4 leading-none">
                                <div className="rounded-lg bg-secondary-50 p-2">
                                    <ImageIcon className="h-5 w-5 text-secondary-600" />
                                </div>
                                <h3 className="font-bold text-zinc-900">Gambar Produk</h3>
                            </div>

                            <ImageUpload
                                value={formData.imageUrl}
                                onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                                description="* Upload gambar produk Anda di sini (Maks. 5MB)"
                            />

                            <div className="mt-6 pt-6 border-t border-zinc-50 text-left">
                                <label htmlFor="imageUrl" className="mb-1.5 block text-sm font-semibold text-zinc-700">
                                    Atau Gunakan URL Gambar
                                </label>
                                <input
                                    id="imageUrl"
                                    name="imageUrl"
                                    type="text"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-xs text-zinc-900 transition-all focus:border-secondary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-secondary-500/10"
                                />
                                <p className="mt-2 text-[10px] text-zinc-400 italic">
                                    * Gunakan link gambar dari internet atau Unsplash jika tidak ingin upload
                                </p>
                            </div>
                        </div>

                        {/* Summary Widget */}
                        <div className="rounded-2xl bg-primary-900 p-6 text-white shadow-xl ring-1 ring-white/10">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/50">
                                <CheckCircle2 className="h-4 w-4 text-primary-400" /> Pratinjau Cepat
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-white/10 pb-3">
                                    <span className="text-sm font-medium text-white/60">Nama</span>
                                    <span className="text-sm font-bold truncate max-w-[150px]">{formData.name || "N/A"}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/10 pb-3">
                                    <span className="text-sm font-medium text-white/60">Harga</span>
                                    <span className="text-sm font-black text-secondary-400 italic">
                                        Rp {(parseInt(formData.price) || 0).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-white/10 pb-3">
                                    <span className="text-sm font-medium text-white/60">Stok Awal</span>
                                    <span className="text-sm font-bold">{formData.stock || "0"} item</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium text-white/60">Varian</span>
                                    <span className="text-sm font-bold">{formData.variants.length} Macam</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
