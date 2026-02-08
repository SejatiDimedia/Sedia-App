"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Search,
    Package,
    ChevronDown,
    Calendar,
    AlertCircle
} from "lucide-react";
import { getOutlets } from "@/actions/outlets";
import { getSuppliers } from "@/actions/suppliers";
import { getProducts } from "@/actions/products";
import { createPurchaseOrder } from "@/actions/purchase-orders";
import Link from "next/link";

interface Supplier {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    costPrice: string;
    variants: any[];
}

interface POItem {
    id: string; // temp id for list key
    productId: string;
    variantId?: string;
    productName: string;
    variantName?: string;
    quantity: number;
    costPrice: number;
}

export default function CreatePurchaseOrderPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [outlets, setOutlets] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedOutletId, setSelectedOutletId] = useState("");

    // Form State
    const [supplierId, setSupplierId] = useState("");
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [expectedDate, setExpectedDate] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<POItem[]>([]);

    // Item Adding State
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [productSearch, setProductSearch] = useState("");

    useEffect(() => {
        // Load initial data
        const init = async () => {
            const outletsData = await getOutlets();
            setOutlets(outletsData);
            if (outletsData.length > 0) {
                setSelectedOutletId(outletsData[0].id);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (!selectedOutletId) return;

        const loadDependencies = async () => {
            const [suppliersData, productsData] = await Promise.all([
                getSuppliers(selectedOutletId),
                getProducts(selectedOutletId)
            ]);

            if (suppliersData.data) setSuppliers(suppliersData.data as any);
            if (productsData.data) setProducts(productsData.data as any);
        };
        loadDependencies();
    }, [selectedOutletId]);

    const handleAddItem = (product: Product, variant?: any) => {
        const newItem: POItem = {
            id: crypto.randomUUID(),
            productId: product.id,
            variantId: variant?.id,
            productName: product.name,
            variantName: variant?.name,
            quantity: 1,
            costPrice: Number(variant ? (parseFloat(product.costPrice) || 0) : (parseFloat(product.costPrice) || 0)), // Use base cost or specific? simplified for now
        };

        setItems([...items, newItem]);
        setIsAddingItem(false);
        setProductSearch("");
    };

    const updateItem = (id: string, field: keyof POItem, value: any) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSubmit = async () => {
        if (!supplierId || items.length === 0) return;

        setIsLoading(true);
        try {
            const res = await createPurchaseOrder({
                outletId: selectedOutletId,
                supplierId,
                orderDate: new Date(orderDate),
                expectedDate: expectedDate ? new Date(expectedDate) : undefined,
                notes,
                items: items.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId || null,
                    quantity: Number(item.quantity),
                    costPrice: Number(item.costPrice)
                }))
            });

            if (res.success) {
                router.push("/dashboard/purchase-orders");
            } else {
                alert("Gagal membuat PO");
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/purchase-orders"
                    className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-zinc-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Buat Purchase Order</h1>
                    <p className="text-sm text-zinc-500">Form pemesanan barang ke supplier</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Info Card */}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">No. Invoice PO</label>
                                <div className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 text-sm font-mono">
                                    (Auto Generated)
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Tanggal Pesan</label>
                                <input
                                    type="date"
                                    value={orderDate}
                                    onChange={e => setOrderDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:border-primary-500 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Supplier</label>
                            <select
                                value={supplierId}
                                onChange={e => setSupplierId(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:border-primary-500 bg-white"
                            >
                                <option value="">Pilih Supplier...</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            {suppliers.length === 0 && (
                                <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Belum ada data supplier. Tambahkan di menu Supplier.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Items Card */}
                    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                            <h3 className="font-bold text-zinc-900">Daftar Barang</h3>
                            <button
                                onClick={() => setIsAddingItem(true)}
                                className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Barang
                            </button>
                        </div>

                        {/* Add Item Panel */}
                        {isAddingItem && (
                            <div className="p-4 bg-primary-50 border-b border-primary-100 animate-in slide-in-from-top-2">
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Cari nama produk..."
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm"
                                    />
                                </div>
                                <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                                    {filteredProducts.slice(0, 10).map(product => (
                                        <div key={product.id}>
                                            <button
                                                onClick={() => handleAddItem(product)}
                                                className="w-full text-left px-3 py-2 hover:bg-white rounded-lg transition-colors flex justify-between items-center group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded bg-white border border-primary-100 flex items-center justify-center">
                                                        <Package className="h-4 w-4 text-primary-300" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-primary-900">{product.name}</div>
                                                        <div className="text-xs text-primary-500">{product.variants.length > 0 ? `${product.variants.length} Varian` : 'No Variants'}</div>
                                                    </div>
                                                </div>
                                                {product.variants.length === 0 && (
                                                    <Plus className="h-4 w-4 text-primary-400 opacity-0 group-hover:opacity-100" />
                                                )}
                                            </button>

                                            {/* Variant Sub-items */}
                                            {product.variants.length > 0 && (
                                                <div className="pl-12 pr-2 space-y-1 mt-1">
                                                    {product.variants.map((v: any) => (
                                                        <button
                                                            key={v.id}
                                                            onClick={() => handleAddItem(product, v)}
                                                            className="w-full text-left px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-white hover:text-primary-600 rounded-md flex justify-between items-center"
                                                        >
                                                            <span>{v.name}</span>
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <button onClick={() => setIsAddingItem(false)} className="text-xs text-primary-500 font-medium">Batal</button>
                                </div>
                            </div>
                        )}

                        <div className="divide-y divide-zinc-100">
                            {items.length === 0 ? (
                                <div className="text-center py-12 text-zinc-400">
                                    <p className="text-sm">Belum ada barang dipilih</p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-zinc-50/50">
                                        <div className="col-span-5">
                                            <div className="font-medium text-zinc-900 text-sm">{item.productName}</div>
                                            {item.variantName && (
                                                <div className="text-xs text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded inline-block mt-1">
                                                    {item.variantName}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] uppercase text-zinc-400 font-bold block mb-1">Qty</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                className="w-full px-2 py-1 rounded border border-zinc-200 text-sm text-center focus:border-primary-500 focus:outline-none"
                                            />
                                        </div>
                                        <div className="col-span-4">
                                            <label className="text-[10px] uppercase text-zinc-400 font-bold block mb-1">Harga Beli Per Unit</label>
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">Rp</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.costPrice}
                                                    onChange={(e) => updateItem(item.id, 'costPrice', parseInt(e.target.value) || 0)}
                                                    className="w-full pl-8 pr-2 py-1 rounded border border-zinc-200 text-sm text-right focus:border-primary-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-1 text-right">
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-zinc-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Total Footer */}
                        {items.length > 0 && (
                            <div className="bg-zinc-50 p-4 border-t border-zinc-200 flex justify-between items-center">
                                <span className="font-bold text-zinc-500 text-sm uppercase">Total Estimasi</span>
                                <span className="text-xl font-bold text-zinc-900">Rp {totalAmount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                        <h3 className="font-bold text-zinc-900 mb-4">Informasi Tambahan</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Estimasi Tiba</label>
                                <input
                                    type="date"
                                    value={expectedDate}
                                    onChange={e => setExpectedDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:border-primary-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Catatan</label>
                                <textarea
                                    rows={4}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Catatan tambahan untuk supplier..."
                                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:border-primary-500 text-sm resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || items.length === 0 || !supplierId}
                        className="w-full py-4 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                Simpan Draft PO
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
