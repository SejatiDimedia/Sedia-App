"use client";

import { useState, useEffect } from "react";
import { X, ShoppingBag, Minus, Plus, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Variant {
    id: string;
    name: string;
    priceAdjustment: string | null;
    stock: number | null;
    isActive: boolean | null;
}

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string | null;
    categoryName?: string | null;
    variants?: Variant[];
}

interface ProductDetailModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    primaryColor: string;
    outletPhone?: string | null;
}

export function ProductDetailModal({ product, isOpen, onClose, primaryColor, outletPhone }: ProductDetailModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Reset state when product changes
    useEffect(() => {
        if (isOpen && product) {
            setQuantity(1);
            setIsConfirmOpen(false);
            setHasError(false); // Reset error state on product change
            if (product.variants && product.variants.length > 0) {
                // Select first active variant by default
                const firstActive = product.variants.find(v => v.isActive !== false);
                setSelectedVariantId(firstActive ? firstActive.id : null);
            } else {
                setSelectedVariantId(null);
            }
        }
    }, [isOpen, product]);

    if (!product) return null;

    const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);

    // Calculate final price
    const basePrice = Number(product.price);
    const adjustment = selectedVariant ? Number(selectedVariant.priceAdjustment || 0) : 0;
    const finalPrice = basePrice + adjustment;
    const totalPrice = finalPrice * quantity;

    // Determine stock
    // If variant is selected, use variant stock (if tracked), otherwise use product stock
    // For simplicity sake, we'll try to use variant stock first if available
    const stockToDisplay = selectedVariant && selectedVariant.stock !== null
        ? selectedVariant.stock
        : product.stock;

    const isOutOfStock = stockToDisplay <= 0;
    const maxQuantity = stockToDisplay > 0 ? stockToDisplay : 1;

    const handleQuantityChange = (delta: number) => {
        const newQty = quantity + delta;
        if (newQty >= 1 && newQty <= maxQuantity) {
            setQuantity(newQty);
        }
    };

    const handleWhatsAppRedirect = () => {
        if (outletPhone) {
            // Format phone number (remove leading 0 or 62, ensure clean number)
            let phone = outletPhone.replace(/\D/g, '');
            if (phone.startsWith('0')) phone = '62' + phone.substring(1);
            if (!phone.startsWith('62')) phone = '62' + phone;

            // Create message
            const variantText = selectedVariant ? ` - ${selectedVariant.name}` : '';
            const message = `Halo, saya ingin pesan:\n\n*${product.name}*${variantText}\nQty: ${quantity}\nHarga: Rp ${totalPrice.toLocaleString('id-ID')}\n\nTerima kasih.`;

            // Open WhatsApp
            const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
            setIsConfirmOpen(false);
            onClose();
        } else {
            // Fallback if no phone number
            alert("Nomor WhatsApp outlet belum diatur. Silakan hubungi kasir.");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-white rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 p-2 bg-white/50 backdrop-blur-md rounded-full text-zinc-900 shadow-sm hover:bg-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="overflow-y-auto flex-1 scrollbar-hide">
                            {/* Image Header */}
                            <div className="relative w-full aspect-square sm:aspect-video bg-zinc-100">
                                {product.imageUrl && !hasError ? (
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        fill
                                        onError={() => setHasError(true)}
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-zinc-300">
                                        <Package className="w-20 h-20" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 sm:opacity-40"></div>

                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white translate-y-2">
                                    {product.categoryName && (
                                        <span
                                            className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg mb-2"
                                            style={{ backgroundColor: `${primaryColor}CC` }}
                                        >
                                            {product.categoryName}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 pt-2 space-y-6">
                                {/* Title & Price */}
                                <div>
                                    <h2 className="text-2xl font-brand font-black text-zinc-900 leading-tight mb-2">
                                        {product.name}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="text-2xl font-bold"
                                            style={{ color: primaryColor }}
                                        >
                                            Rp {finalPrice.toLocaleString("id-ID")}
                                        </span>
                                        {selectedVariant && (
                                            <span className="text-sm text-zinc-400 line-through">
                                                {/* Optional: Show base price if discounted, currently logic is additive so maybe not strict strikethrough needed unless explicit simple pricing */}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Variants */}
                                {product.variants && product.variants.length > 0 && (
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                                            Pilih Varian
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {product.variants.map((variant) => (
                                                <button
                                                    key={variant.id}
                                                    onClick={() => setSelectedVariantId(variant.id)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200",
                                                        selectedVariantId === variant.id
                                                            ? "bg-zinc-900 text-white border-zinc-900 shadow-md transform scale-105"
                                                            : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                                                    )}
                                                >
                                                    {variant.name}
                                                    {Number(variant.priceAdjustment) > 0 && (
                                                        <span className="ml-1 opacity-70 text-xs">
                                                            (+{Number(variant.priceAdjustment).toLocaleString("id-ID")})
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Stock Status */}
                                <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 rounded-xl">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        isOutOfStock ? "bg-red-500" : stockToDisplay <= 5 ? "bg-amber-500" : "bg-emerald-500"
                                    )} />
                                    <span className="text-sm font-medium text-zinc-600">
                                        {isOutOfStock
                                            ? "Stok Habis"
                                            : `Stok Tersedia: ${stockToDisplay} item`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 sm:p-6 border-t border-zinc-100 bg-white space-y-4">
                            <div className="flex items-center justify-between">
                                {/* Quantity Selector */}
                                <div className="flex items-center gap-3 bg-zinc-100 rounded-2xl p-1.5 h-12">
                                    <button
                                        onClick={() => handleQuantityChange(-1)}
                                        disabled={quantity <= 1 || isOutOfStock}
                                        className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm text-zinc-900 disabled:opacity-50 disabled:shadow-none hover:scale-95 transition-transform"
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-8 text-center font-bold text-lg tabular-nums text-zinc-900">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => handleQuantityChange(1)}
                                        disabled={quantity >= maxQuantity || isOutOfStock}
                                        className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm text-zinc-900 disabled:opacity-50 disabled:shadow-none hover:scale-95 transition-transform"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Total Price Display */}
                                <div className="text-right">
                                    <span className="block text-xs text-zinc-400 font-medium mb-0.5">Total Harga</span>
                                    <span
                                        className="text-xl font-black text-zinc-900 leading-none"
                                        style={{ color: primaryColor }}
                                    >
                                        Rp {totalPrice.toLocaleString("id-ID")}
                                    </span>
                                </div>
                            </div>

                            {/* Main Action Button */}
                            <button
                                onClick={() => outletPhone ? setIsConfirmOpen(true) : alert("Nomor WhatsApp outlet belum diatur.")}
                                disabled={isOutOfStock}
                                className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-lg shadow-xl shadow-zinc-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: isOutOfStock ? '#9ca3af' : primaryColor }}
                            >
                                <ShoppingBag className="w-5 h-5" />
                                <span>
                                    {isOutOfStock ? "Stok Habis" : "Pesan via WhatsApp"}
                                </span>
                            </button>
                        </div>
                    </motion.div>

                    {/* Confirmation Popup */}
                    <AnimatePresence>
                        {isConfirmOpen && (
                            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsConfirmOpen(false)}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center overflow-hidden"
                                >
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShoppingBag className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-900 mb-2">
                                        Hubungi Penjual?
                                    </h3>
                                    <p className="text-zinc-500 mb-6 text-sm leading-relaxed">
                                        Anda akan diarahkan ke WhatsApp <strong>{outletPhone}</strong> untuk mengirim detail pesanan ini.
                                    </p>

                                    <div className="space-y-3">
                                        <button
                                            onClick={handleWhatsAppRedirect}
                                            className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all"
                                        >
                                            Lanjut ke WhatsApp
                                        </button>
                                        <button
                                            onClick={() => setIsConfirmOpen(false)}
                                            className="w-full py-3.5 rounded-xl bg-zinc-100 text-zinc-600 font-bold text-sm hover:bg-zinc-200 active:scale-95 transition-all"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </AnimatePresence>
    );
}
