"use client";

import { useCart } from "./CartProvider";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, MessageCircle, Package, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface CartDrawerProps {
    primaryColor: string;
    outletPhone?: string | null;
    outletName: string;
}

export function CartDrawer({ primaryColor, outletPhone, outletName }: CartDrawerProps) {
    const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart, isCartOpen, setIsCartOpen } = useCart();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [orderSent, setOrderSent] = useState(false);
    const [hasError, setHasError] = useState<Record<string, boolean>>({});

    const handleWhatsAppCheckout = () => {
        if (!outletPhone) {
            alert("Nomor WhatsApp outlet belum diatur.");
            return;
        }

        let phone = outletPhone.replace(/\D/g, "");
        if (phone.startsWith("0")) phone = "62" + phone.substring(1);
        if (!phone.startsWith("62")) phone = "62" + phone;

        const itemLines = items.map((item, idx) => {
            const adj = item.variant ? Number(item.variant.priceAdjustment || 0) : 0;
            const unitPrice = item.price + adj;
            const subtotal = unitPrice * item.quantity;
            const variantText = item.variant ? ` (${item.variant.name})` : "";
            return `${idx + 1}. *${item.name}*${variantText}\n   ${item.quantity}x @ Rp ${unitPrice.toLocaleString("id-ID")} = Rp ${subtotal.toLocaleString("id-ID")}`;
        });

        const message = `Halo *${outletName}*, saya ingin pesan:\n\n${itemLines.join("\n\n")}\n\n*Total: Rp ${totalPrice.toLocaleString("id-ID")}*\n\nTerima kasih 🙏`;

        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
        clearCart();
        setIsConfirmOpen(false);
        setOrderSent(true);
    };

    const getItemKey = (item: typeof items[0]) => `${item.productId}-${item.variant?.id || "base"}`;

    return (
        <>
            {/* Floating Cart Button */}
            <AnimatePresence>
                {totalItems > 0 && !isCartOpen && (
                    <motion.button
                        initial={{ scale: 0, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0, y: 50 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsCartOpen(true)}
                        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl text-white font-bold shadow-2xl transition-shadow hover:shadow-3xl"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <div className="relative">
                            <ShoppingBag className="w-5 h-5" />
                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-black" style={{ color: primaryColor }}>
                                {totalItems}
                            </span>
                        </div>
                        <span className="text-sm">Rp {totalPrice.toLocaleString("id-ID")}</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Cart Drawer */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-lg bg-white rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${primaryColor}15` }}
                                    >
                                        <ShoppingBag className="w-5 h-5" style={{ color: primaryColor }} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-zinc-900">Keranjang</h3>
                                        <p className="text-xs text-zinc-500">{totalItems} item</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {items.length > 0 && (
                                        <button
                                            onClick={clearCart}
                                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-xs font-medium"
                                        >
                                            Hapus Semua
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsCartOpen(false)}
                                        className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-hide">
                                {items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                                            <ShoppingBag className="w-8 h-8 text-zinc-300" />
                                        </div>
                                        <p className="text-zinc-500 font-medium">Keranjang kosong</p>
                                        <p className="text-zinc-400 text-sm mt-1">Mulai pilih produk untuk memesan</p>
                                    </div>
                                ) : (
                                    items.map((item) => {
                                        const key = getItemKey(item);
                                        const adj = item.variant ? Number(item.variant.priceAdjustment || 0) : 0;
                                        const unitPrice = item.price + adj;
                                        const subtotal = unitPrice * item.quantity;

                                        return (
                                            <motion.div
                                                key={key}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="flex gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-100"
                                            >
                                                {/* Product image */}
                                                <div className="w-14 h-14 shrink-0 rounded-xl bg-white overflow-hidden border border-zinc-100">
                                                    {item.imageUrl && !hasError[key] ? (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                            onError={() => setHasError(prev => ({ ...prev, [key]: true }))}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                                            <Package className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm text-zinc-900 truncate">{item.name}</h4>
                                                    {item.variant && (
                                                        <span className="text-[10px] px-2 py-0.5 bg-zinc-200 text-zinc-600 rounded-md font-medium">
                                                            {item.variant.name}
                                                        </span>
                                                    )}
                                                    <p className="text-xs font-bold mt-1" style={{ color: primaryColor }}>
                                                        Rp {subtotal.toLocaleString("id-ID")}
                                                    </p>
                                                </div>

                                                {/* Controls */}
                                                <div className="flex flex-col items-end justify-between shrink-0">
                                                    <button
                                                        onClick={() => removeItem(item.productId, item.variant?.id)}
                                                        className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>

                                                    <div className="flex items-center gap-1.5 bg-white rounded-lg border border-zinc-200 p-0.5">
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.variant?.id || null, item.quantity - 1)}
                                                            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-600 transition-colors"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="w-6 text-center text-xs font-bold text-zinc-900 tabular-nums">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.variant?.id || null, item.quantity + 1)}
                                                            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-600 transition-colors"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            {items.length > 0 && (
                                <div className="p-5 border-t border-zinc-100 bg-white space-y-4">
                                    {/* Total */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-500 font-medium">Total ({totalItems} item)</span>
                                        <span className="text-xl font-black" style={{ color: primaryColor }}>
                                            Rp {totalPrice.toLocaleString("id-ID")}
                                        </span>
                                    </div>

                                    {/* Checkout Button */}
                                    <button
                                        onClick={() => setIsConfirmOpen(true)}
                                        className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-base shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        Pesan via WhatsApp
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* WhatsApp Confirmation */}
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
                            className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 mb-2">Kirim Pesanan?</h3>
                            <p className="text-zinc-500 mb-2 text-sm leading-relaxed">
                                {totalItems} item — <strong>Rp {totalPrice.toLocaleString("id-ID")}</strong>
                            </p>
                            <p className="text-zinc-400 mb-6 text-xs">
                                Anda akan diarahkan ke WhatsApp <strong>{outletPhone}</strong>
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleWhatsAppCheckout}
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

            {/* Order Sent Success Popup */}
            <AnimatePresence>
                {orderSent && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOrderSent(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                            className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.15, type: "spring", damping: 12 }}
                                className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5"
                            >
                                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                            </motion.div>

                            <h3 className="text-xl font-bold text-zinc-900 mb-2">Pesanan Terkirim!</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed mb-1">
                                Pesanan Anda telah dikirim ke <strong>{outletName}</strong> melalui WhatsApp.
                            </p>
                            <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                                Mohon menunggu konfirmasi dari penjual mengenai ketersediaan dan detail pengiriman.
                            </p>

                            <button
                                onClick={() => setOrderSent(false)}
                                className="w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                                style={{ backgroundColor: primaryColor }}
                            >
                                Mengerti
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
