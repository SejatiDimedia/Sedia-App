"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Plus,
    Search,
    Package,
    Pencil,
    Trash2,
    FileText,
    Upload,
    Download,
    X,
    Loader2,
    Check,
    ExternalLink,
    TrendingUp,
    AlertTriangle,
    PackageCheck,
    Layers,
    MoreVertical,
    Eye,
    ToggleLeft,
    ToggleRight,
    ChevronDown,
    Share2,
} from "lucide-react";
import { slugify } from "@/utils/slug";
import {
    getProducts,
    deleteProduct,
    generateProducts,
    importProducts,
    bulkDeleteProducts,
    bulkUpdateProductStatus,
} from "./actions";
import { useOutlet } from "@/providers/outlet-provider";
import { toast } from "react-hot-toast";
import ConfirmationModal from "@/components/confirmation-modal";

function ProductImage({ src, alt, className, iconSize = "h-8 w-8" }: { src?: string | null; alt: string; className?: string; iconSize?: string }) {
    const [error, setError] = useState(!src);

    if (error || !src) {
        return (
            <div className={`flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-50 ${className}`}>
                <Package className={`${iconSize} text-zinc-300`} />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={`object-cover ${className}`}
            onError={() => setError(true)}
        />
    );
}

// Basic types based on schema
interface Product {
    id: string;
    name: string;
    sku: string | null;
    price: string;
    stock: number;
    isActive: boolean | null;
    imageUrl: string | null;
    categoryId?: string | null;
    category?: { name: string } | null;
}

export default function ProductsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);
    const { activeOutlet, activeOutletId } = useOutlet();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: "primary" | "danger" | "warning";
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
    });

    useEffect(() => {
        if (activeOutletId) {
            loadData(activeOutletId);
        }
    }, [activeOutletId]);

    const loadData = async (outletId: string) => {
        setIsLoading(true);
        try {
            await fetchProducts(outletId);
            const { getCategories } = await import("@/app/dashboard/products/actions");
            const catRes = await getCategories(outletId);
            if (catRes.data) {
                setCategories(catRes.data);
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

    const showConfirm = (config: Omit<typeof confirmState, "isOpen">) => {
        setConfirmState({ ...config, isOpen: true });
    };

    const handleConfirm = () => {
        confirmState.onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    };

    const handleGenerate = async () => {
        if (!activeOutletId) return;
        setIsGenerating(true);
        try {
            const res = await generateProducts(activeOutletId);
            if (res.success) {
                toast.success("Data produk percobaan berhasil dibuat!");
                fetchProducts(activeOutletId);
            } else {
                toast.error("Gagal membuat data: " + res.error);
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyLink = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success("Link katalog berhasil disalin!");
        }).catch((err) => {
            console.error('Failed to copy: ', err);
            toast.error("Gagal menyalin link");
        });
    };

    const handleShareCatalog = async () => {
        if (!activeOutlet) return;
        const url = `${window.location.origin}/catalog/${slugify(activeOutlet.name)}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: activeOutlet.name,
                    text: `Cek katalog produk ${activeOutlet.name} di sini:`,
                    url: url,
                });
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    copyLink(url);
                }
            }
        } else {
            copyLink(url);
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm({
            title: "Hapus Produk",
            message: "Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.",
            variant: "danger",
            onConfirm: async () => {
                setIsDeleting(id);
                try {
                    const res = await deleteProduct(id);
                    if (res.success) {
                        toast.success("Produk dihapus");
                        setProducts(prev => prev.filter(p => p.id !== id));
                    } else {
                        toast.error("Gagal menghapus: " + res.error);
                    }
                } catch (error) {
                    console.error(error);
                    toast.error("Terjadi kesalahan saat menghapus");
                } finally {
                    setIsDeleting(null);
                }
            }
        });
    };

    const handleQuickToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await bulkUpdateProductStatus([id], !currentStatus);
            if (res.success) {
                toast.success(`Produk ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
                setProducts(prev => prev.map(p =>
                    p.id === id ? { ...p, isActive: !currentStatus } : p
                ));
            } else {
                toast.error("Gagal memperbarui status");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    };

    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategoryId === "all" || product.categoryId === selectedCategoryId;

        return matchesSearch && matchesCategory;
    });

    const handleDownloadTemplate = async () => {
        try {
            const XLSX = await import("xlsx");
            const templateData = [
                {
                    "Nama": "Kopi Susu Gula Aren",
                    "Kategori": "Minuman",
                    "SKU": "KOP-001",
                    "Barcode": "12345678",
                    "Harga Jual": "22000",
                    "Harga Modal": "10000",
                    "Stok": "100"
                }
            ];
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Template Produk");
            XLSX.writeFile(workbook, "Template_Produk_SediaPOS.xlsx");
            toast.success("Template berhasil diunduh");
        } catch (error) {
            console.error(error);
            toast.error("Gagal membuat template");
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeOutletId) return;

        setIsImporting(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64Data = (event.target?.result as string).split(",")[1];
                const res = await importProducts(activeOutletId, base64Data);
                if (res.success) {
                    toast.success(`${res.count} produk berhasil diimpor!`);
                    setIsImportModalOpen(false);
                    fetchProducts(activeOutletId);
                } else {
                    toast.error("Gagal impor: " + res.error);
                }
                setIsImporting(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan saat membaca file");
            setIsImporting(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedProductIds(filteredProducts.map(p => p.id));
        } else {
            setSelectedProductIds([]);
        }
    };

    const handleSelectProduct = (id: string) => {
        setSelectedProductIds(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        showConfirm({
            title: "Hapus Masal Produk",
            message: `Apakah Anda yakin ingin menghapus ${selectedProductIds.length} produk terpilih? Tindakan ini tidak dapat dibatalkan.`,
            variant: "danger",
            onConfirm: async () => {
                setIsBulkProcessing(true);
                try {
                    const res = await bulkDeleteProducts(selectedProductIds);
                    if (res.success) {
                        toast.success(`${selectedProductIds.length} produk berhasil dihapus`);
                        setSelectedProductIds([]);
                        fetchProducts(activeOutletId);
                    } else {
                        toast.error("Gagal menghapus produk: " + res.error);
                    }
                } catch (error) {
                    console.error(error);
                    toast.error("Terjadi kesalahan saat menghapus");
                } finally {
                    setIsBulkProcessing(false);
                }
            }
        });
    };

    const handleBulkUpdateStatus = async (isActive: boolean) => {
        setIsBulkProcessing(true);
        try {
            const res = await bulkUpdateProductStatus(selectedProductIds, isActive);
            if (res.success) {
                toast.success(`Status ${selectedProductIds.length} produk berhasil diperbarui`);
                setSelectedProductIds([]);
                fetchProducts(activeOutletId);
            } else {
                toast.error("Gagal memperbarui status: " + res.error);
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan saat memperbarui status");
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const formatPrice = (price: string) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(parseInt(price));
    };

    // Stats calculations
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;
    const lowStockProducts = products.filter(p => p.stock <= 10 && p.stock > 0).length;
    const outOfStockProducts = products.filter(p => p.stock === 0).length;

    const stats = [
        {
            label: "Total Produk",
            value: totalProducts,
            icon: Package,
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
        },
        {
            label: "Produk Aktif",
            value: activeProducts,
            icon: PackageCheck,
            color: "from-emerald-500 to-emerald-600",
            bgColor: "bg-emerald-50",
            textColor: "text-emerald-600",
        },
        {
            label: "Stok Rendah",
            value: lowStockProducts,
            icon: AlertTriangle,
            color: "from-amber-500 to-amber-600",
            bgColor: "bg-amber-50",
            textColor: "text-amber-600",
        },
        {
            label: "Stok Habis",
            value: outOfStockProducts,
            icon: Layers,
            color: "from-rose-500 to-rose-600",
            bgColor: "bg-rose-50",
            textColor: "text-rose-600",
        },
    ];

    const getStockBadge = (stock: number) => {
        if (stock === 0) {
            return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">Habis</span>;
        }
        if (stock <= 10) {
            return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{stock} <AlertTriangle className="h-3 w-3" /></span>;
        }
        return <span className="text-sm font-medium text-zinc-700">{stock}</span>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black text-zinc-900">
                        Manajemen Produk
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Kelola katalog produk dan stok inventori
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {activeOutlet && (
                        <>
                            <button
                                onClick={handleShareCatalog}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 hover:border-zinc-300"
                                title="Bagikan Katalog"
                            >
                                <Share2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Bagikan</span>
                            </button>
                            <Link
                                href={`/catalog/${slugify(activeOutlet.name)}`}
                                target="_blank"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 hover:border-zinc-300"
                            >
                                <ExternalLink className="h-4 w-4" />
                                <span className="hidden sm:inline">Lihat</span>
                            </Link>
                        </>
                    )}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !activeOutletId}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50"
                        title="Generate Data Demo"
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                        <span className="hidden lg:inline">Generate Demo</span>
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 hover:border-zinc-300"
                        title="Impor Produk"
                    >
                        <Upload className="h-4 w-4" />
                        <span className="hidden lg:inline">Impor</span>
                    </button>
                    <Link
                        href={`/dashboard/products/new?outletId=${activeOutletId}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-primary-500/40 hover:from-primary-700 hover:to-primary-800"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Produk
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="group relative overflow-hidden rounded-2xl border border-zinc-100 bg-white p-5 transition-all hover:shadow-lg hover:shadow-zinc-200/50 hover:border-zinc-200"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{stat.label}</p>
                                <p className="mt-2 text-3xl font-black text-zinc-900">{stat.value}</p>
                            </div>
                            <div className={`rounded-xl ${stat.bgColor} p-3`}>
                                <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                            </div>
                        </div>
                        <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${stat.color} opacity-0 transition-opacity group-hover:opacity-100`} />
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Cari nama produk atau SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-11 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                        />
                    </div>
                    <p className="text-sm text-zinc-500">
                        <span className="font-semibold text-zinc-900">{filteredProducts.length}</span> produk ditemukan
                    </p>
                </div>

                {/* Category Pills */}
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                    <button
                        onClick={() => setSelectedCategoryId("all")}
                        className={`flex h-9 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-all ${selectedCategoryId === "all"
                            ? "bg-zinc-900 text-white shadow-sm"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                            }`}
                    >
                        Semua
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategoryId(category.id)}
                            className={`flex h-9 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-all ${selectedCategoryId === category.id
                                ? "bg-zinc-900 text-white shadow-sm"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Table */}
            <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50/50">
                            <th className="w-12 px-4 py-4 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                                />
                            </th>
                            <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Produk
                            </th>
                            <th className="hidden px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                                Kategori
                            </th>
                            <th className="hidden px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell">
                                SKU
                            </th>
                            <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Harga
                            </th>
                            <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Stok
                            </th>
                            <th className="hidden px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                                Status
                            </th>
                            <th className="w-20 px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-16 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-500" />
                                    <p className="mt-3 text-sm text-zinc-500">Memuat produk...</p>
                                </td>
                            </tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-16 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
                                        <Package className="h-8 w-8 text-zinc-400" />
                                    </div>
                                    <p className="font-semibold text-zinc-900">Tidak ada produk</p>
                                    <p className="mt-1 text-sm text-zinc-500">
                                        {searchQuery ? "Coba ubah kata kunci pencarian" : "Mulai dengan menambah produk baru"}
                                    </p>
                                    {!searchQuery && (
                                        <Link
                                            href={`/dashboard/products/new?outletId=${activeOutletId}`}
                                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Tambah Produk
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product) => (
                                <tr
                                    key={product.id}
                                    className={`group transition-colors hover:bg-zinc-50/50 ${selectedProductIds.includes(product.id) ? 'bg-primary-50/30' : ''}`}
                                >
                                    <td className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedProductIds.includes(product.id)}
                                            onChange={() => handleSelectProduct(product.id)}
                                            className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-4">
                                            <ProductImage
                                                src={product.imageUrl || (product as any).image_url}
                                                alt={product.name}
                                                className="h-12 w-12 rounded-xl ring-1 ring-zinc-100"
                                                iconSize="h-5 w-5"
                                            />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-zinc-900 truncate max-w-[200px]">
                                                    {product.name}
                                                </p>
                                                {product.category && (
                                                    <p className="text-xs text-zinc-500 md:hidden">{product.category.name}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-4 md:table-cell">
                                        {product.category ? (
                                            <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                                                {product.category.name}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-400">-</span>
                                        )}
                                    </td>
                                    <td className="hidden px-4 py-4 text-sm text-zinc-500 font-mono lg:table-cell">
                                        {product.sku || <span className="text-zinc-300">-</span>}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="font-semibold text-zinc-900">{formatPrice(product.price)}</span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {getStockBadge(product.stock)}
                                    </td>
                                    <td className="hidden px-4 py-4 text-center sm:table-cell">
                                        <button
                                            onClick={() => handleQuickToggleStatus(product.id, product.isActive)}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${product.isActive
                                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                                                }`}
                                        >
                                            {product.isActive ? (
                                                <>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    Aktif
                                                </>
                                            ) : (
                                                <>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                                                    Nonaktif
                                                </>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                            <Link
                                                href={`/dashboard/products/${product.id}/edit`}
                                                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                                                title="Edit"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                disabled={isDeleting === product.id}
                                                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                                                title="Hapus"
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

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
                        onClick={() => !isImporting && setIsImportModalOpen(false)}
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-zinc-900">Impor Produk</h3>
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
                                disabled={isImporting}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center hover:border-primary-300 transition-colors">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
                                    <FileText className="h-8 w-8 text-primary-600" />
                                </div>
                                <h4 className="mb-1 text-sm font-semibold text-zinc-900">Upload File Excel</h4>
                                <p className="mb-6 text-xs text-zinc-500">Gunakan template untuk hasil terbaik</p>

                                <label className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 cursor-pointer transition-all hover:shadow-primary-500/40 ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <Upload className="h-4 w-4" />
                                    {isImporting ? 'Mengimpor...' : 'Pilih File Excel'}
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls, .csv"
                                        className="hidden"
                                        onChange={handleImport}
                                        disabled={isImporting}
                                    />
                                </label>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                                >
                                    <Download className="h-4 w-4" />
                                    Unduh Template Excel
                                </button>
                                <p className="text-[10px] text-zinc-400 text-center">
                                    * Format yang didukung: .xlsx, .xls, .csv
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Action Bar */}
            {selectedProductIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2 transform">
                    <div className="flex items-center gap-4 rounded-2xl bg-zinc-900 px-5 py-3.5 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ring-1 ring-white/10">
                        <div className="flex items-center gap-2.5 border-r border-white/10 pr-4">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-[11px] font-bold text-white">
                                {selectedProductIds.length}
                            </span>
                            <span className="text-sm font-medium text-white">terpilih</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleBulkUpdateStatus(true)}
                                disabled={isBulkProcessing}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30 disabled:opacity-50"
                            >
                                <Check className="h-4 w-4" />
                                Aktifkan
                            </button>
                            <button
                                onClick={() => handleBulkUpdateStatus(false)}
                                disabled={isBulkProcessing}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-600 disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                                Nonaktif
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isBulkProcessing}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/30 disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                Hapus
                            </button>
                            <button
                                onClick={() => setSelectedProductIds([])}
                                disabled={isBulkProcessing}
                                className="ml-1 rounded-lg p-2 text-zinc-500 transition-colors hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant}
                onConfirm={handleConfirm}
                onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                isLoading={isBulkProcessing || isDeleting !== null}
            />
        </div>
    );
}
