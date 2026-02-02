"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    Banknote,
    QrCode,
    X,
    Package,
    Loader2,
    Check,
    Menu,
    ArrowLeft,
    Maximize2,
    Minimize2,
} from "lucide-react";
import { getOutlets } from "@/actions/outlets";
import { getProducts } from "../products/actions";

interface Product {
    id: string;
    name: string;
    sku: string | null;
    price: string;
    stock: number;
    imageUrl?: string | null;
}

interface CartItem extends Product {
    quantity: number;
}

interface PaymentMethod {
    id: string;
    name: string;
    type: string;
}

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOutletId, setSelectedOutletId] = useState("");
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedPayment, setSelectedPayment] = useState<string>("cash");
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [lastInvoice, setLastInvoice] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);

    // Held Orders
    const [heldOrders, setHeldOrders] = useState<any[]>([]);
    const [showHoldOrderModal, setShowHoldOrderModal] = useState(false);
    const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
    const [holdOrderNotes, setHoldOrderNotes] = useState("");
    const [isProcessingHold, setIsProcessingHold] = useState(false);

    // Tax State
    const [taxSettings, setTaxSettings] = useState({
        isEnabled: false,
        name: "Pajak",
        rate: 0,
        isInclusive: false,
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            // 1. Get Outlets
            const outlets = await getOutlets();
            if (outlets.length > 0) {
                const outletId = outlets[0].id;
                setSelectedOutletId(outletId);

                const productsRes = await getProducts(outletId);
                if (productsRes.data) {
                    setProducts(productsRes.data.filter((p: any) => p.isActive && p.stock > 0));
                }

                // 3. Fetch Payment Methods
                const paymentRes = await fetch(`/api/payment-methods?outletId=${outletId}`);
                if (paymentRes.ok) {
                    const paymentData = await paymentRes.json();
                    setPaymentMethods(paymentData);
                }

                // 4. Fetch Tax Settings
                const taxRes = await fetch(`/api/tax-settings?outletId=${outletId}`);
                if (taxRes.ok) {
                    const taxData = await taxRes.json();
                    if (taxData) {
                        setTaxSettings({
                            isEnabled: taxData.is_enabled ?? taxData.isEnabled ?? false,
                            name: taxData.name || "Pajak",
                            rate: parseFloat(taxData.rate) || 0,
                            isInclusive: taxData.is_inclusive ?? taxData.isInclusive ?? false,
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load POS data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                // Check stock
                if (existing.quantity >= product.stock) {
                    alert("Stok tidak cukup!");
                    return prev;
                }
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart((prev) => {
            return prev
                .map((item) => {
                    if (item.id === productId) {
                        const newQty = item.quantity + delta;
                        if (newQty <= 0) return null;
                        if (newQty > item.stock) {
                            alert("Stok tidak cukup!");
                            return item;
                        }
                        return { ...item, quantity: newQty };
                    }
                    return item;
                })
                .filter(Boolean) as CartItem[];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
    };

    const getSubtotal = () => {
        return cart.reduce(
            (sum, item) => sum + parseFloat(item.price) * item.quantity,
            0
        );
    };

    const getTax = () => {
        if (!taxSettings.isEnabled || taxSettings.rate <= 0) return 0;

        const subtotal = getSubtotal();

        if (taxSettings.isInclusive) {
            // Inclusive: Tax is already inside the price
            // Price = Base + Tax
            // Tax = Price - (Price / (1 + rate/100))
            return subtotal - (subtotal / (1 + taxSettings.rate / 100));
        } else {
            // Exclusive: Tax is added on top
            return subtotal * (taxSettings.rate / 100);
        }
    };

    const getTotal = () => {
        const subtotal = getSubtotal();
        const tax = getTax();

        if (taxSettings.isInclusive) {
            // If inclusive, subtotal already contains tax, so total is just subtotal
            // BUT for display purposes we might want to show breakdown
            return subtotal;
        } else {
            // If exclusive, add tax to subtotal
            return subtotal + tax;
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const generateInvoiceNumber = () => {
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, '');
        const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `INV-${date}-${time}-${random}`;
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            alert("Keranjang kosong!");
            return;
        }

        setIsCheckingOut(true);
        try {
            const invoiceNumber = generateInvoiceNumber();

            const transactionData = {
                outletId: selectedOutletId,
                invoiceNumber: invoiceNumber,
                items: cart.map((item) => ({
                    productId: item.id,
                    productName: item.name,
                    productSku: item.sku,
                    quantity: item.quantity,
                    price: parseFloat(item.price), // This is unit price (inclusive if set)
                    total: parseFloat(item.price) * item.quantity,
                })),
                subtotal: taxSettings.isInclusive ? (getSubtotal() - getTax()) : getSubtotal(), // Store base amount as subtotal
                discount: 0,
                tax: getTax(),
                totalAmount: getTotal(),
                paymentMethod: selectedPayment,
                paymentStatus: "paid",
                status: "completed",
                // metadata: { taxName: taxSettings.name, isInclusive: taxSettings.isInclusive } // Optional metadata if DB supports it
            };

            const res = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transactionData),
            });

            if (res.ok) {
                const result = await res.json();
                setLastInvoice(result.invoiceNumber || invoiceNumber);
                setCheckoutSuccess(true);
                setCart([]);
                // Reload products to update stock
                const productsRes = await getProducts(selectedOutletId);
                if (productsRes.data) {
                    setProducts(productsRes.data.filter((p: any) => p.isActive && p.stock > 0));
                }
            } else {
                const error = await res.json();
                alert(`Gagal checkout: ${error.error || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Checkout failed:", error);
            alert("Terjadi kesalahan saat checkout.");
        } finally {
            setIsCheckingOut(false);
            setShowCheckoutModal(false);
        }
    };

    // Held Orders Functions
    const fetchHeldOrders = async () => {
        if (!selectedOutletId) {
            console.log("No outlet selected, skipping fetch held orders");
            return;
        }
        try {
            console.log("Fetching held orders for outlet:", selectedOutletId);
            const res = await fetch(`/api/held-orders?outletId=${selectedOutletId}`);
            if (res.ok) {
                const data = await res.json();
                console.log("Held orders data:", data);
                setHeldOrders(data.map((order: any) => ({
                    ...order,
                    items: JSON.parse(order.items),
                })));
            } else {
                console.error("Failed to fetch held orders:", await res.text());
            }
        } catch (error) {
            console.error("Failed to fetch held orders:", error);
        }
    };

    const handleHoldOrder = async () => {
        if (cart.length === 0) {
            alert("Keranjang kosong!");
            return;
        }
        if (!selectedOutletId) {
            alert("Outlet belum dipilih!");
            return;
        }

        setIsProcessingHold(true);
        try {
            console.log("Holding order:", { outletId: selectedOutletId, items: cart, total: getTotal() });
            const res = await fetch("/api/held-orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    outletId: selectedOutletId,
                    items: cart,
                    notes: holdOrderNotes || null,
                    totalAmount: getTotal(),
                }),
            });

            if (res.ok) {
                setCart([]);
                setHoldOrderNotes("");
                setShowHoldOrderModal(false);
                await fetchHeldOrders();
                alert("Pesanan berhasil ditahan!");
            } else {
                const error = await res.json();
                alert(`Gagal menahan pesanan: ${error.error || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Failed to hold order:", error);
            alert("Terjadi kesalahan saat menahan pesanan.");
        } finally {
            setIsProcessingHold(false);
        }
    };

    const handleResumeOrder = (heldOrder: any) => {
        if (cart.length > 0) {
            if (confirm("Keranjang saat ini akan digantikan dengan pesanan yang ditahan. Lanjutkan?")) {
                setCart(heldOrder.items);
                setHeldOrders((prev) => prev.filter((h) => h.id !== heldOrder.id));
                setShowHeldOrdersModal(false);
            }
        } else {
            setCart(heldOrder.items);
            setHeldOrders((prev) => prev.filter((h) => h.id !== heldOrder.id));
            setShowHeldOrdersModal(false);
        }
    };

    const handleDeleteHeldOrder = async (orderId: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus pesanan yang ditahan ini?")) return;

        try {
            const res = await fetch(`/api/held-orders/${orderId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setHeldOrders((prev) => prev.filter((h) => h.id !== orderId));
                alert("Pesanan berhasil dihapus.");
            } else {
                alert("Gagal menghapus pesanan.");
            }
        } catch (error) {
            console.error("Failed to delete held order:", error);
            alert("Terjadi kesalahan.");
        }
    };

    // Fetch held orders when outlet changes
    useEffect(() => {
        if (selectedOutletId) {
            fetchHeldOrders();
        }
    }, [selectedOutletId]);

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-100">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-80px)] gap-4">
            {/* Product Grid */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white">
                {/* Search Bar */}
                <div className="border-b border-zinc-200 p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                    </div>
                </div>

                {/* Products */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredProducts.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-zinc-400">
                            <Package className="mb-2 h-12 w-12" />
                            <p>Tidak ada produk tersedia</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {filteredProducts.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-3 text-left transition-all hover:border-primary-300 hover:shadow-md"
                                >
                                    <div className="mb-2 flex h-16 w-full items-center justify-center rounded-lg bg-zinc-100">
                                        <Package className="h-8 w-8 text-zinc-300 group-hover:text-primary-400" />
                                    </div>
                                    <p className="mb-1 line-clamp-2 text-sm font-medium text-zinc-900">
                                        {product.name}
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        Stok: {product.stock}
                                    </p>
                                    <p className="mt-auto pt-2 text-sm font-bold text-primary-600">
                                        {formatPrice(parseFloat(product.price))}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Panel */}
            <div className="flex w-80 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white lg:w-96">
                {/* Cart Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 p-4">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-zinc-600" />
                        <h2 className="font-semibold text-zinc-900">Keranjang</h2>
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                            {cart.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowHeldOrdersModal(true)}
                            className="flex items-center gap-1.5 rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-1.5 text-xs font-medium text-secondary-700 transition-colors hover:bg-secondary-100"
                        >
                            <Package className="h-3.5 w-3.5" />
                            Pesanan Ditahan
                            {heldOrders.length > 0 && (
                                <span className="rounded-full bg-secondary-500 px-1.5 py-0.5 text-[10px] font-bold text-primary-950">
                                    {heldOrders.length}
                                </span>
                            )}
                        </button>
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="text-xs text-red-500 hover:text-red-600"
                            >
                                Hapus Semua
                            </button>
                        )}
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4">
                    {cart.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-zinc-400">
                            <ShoppingCart className="mb-2 h-12 w-12" />
                            <p className="text-sm">Keranjang kosong</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-zinc-900">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {formatPrice(parseFloat(item.price))}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-6 text-center text-sm font-medium">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="rounded-lg p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cart Footer */}
                <div className="border-t border-zinc-200 bg-zinc-50 p-4">
                    {/* Totals */}
                    <div className="mb-4 space-y-2">
                        <div className="flex justify-between text-sm text-zinc-600">
                            <span>Subtotal</span>
                            <span>{formatPrice(getSubtotal())}</span>
                        </div>
                        {getTax() > 0 && (
                            <div className="flex justify-between text-sm text-zinc-600">
                                <span>{taxSettings.name} ({taxSettings.isInclusive ? "Termasuk" : `${taxSettings.rate}%`})</span>
                                <span>{formatPrice(getTax())}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-zinc-200 pt-2 text-lg font-bold text-zinc-900">
                            <span>Total</span>
                            <span className="text-primary-600">{formatPrice(getTotal())}</span>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="mb-4">
                        <p className="mb-2 text-xs font-medium text-zinc-500">
                            Metode Pembayaran
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setSelectedPayment("cash")}
                                className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${selectedPayment === "cash"
                                    ? "border-primary-500 bg-primary-50 text-primary-700"
                                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                                    }`}
                            >
                                <Banknote className="h-4 w-4" />
                                Cash
                            </button>
                            <button
                                onClick={() => setSelectedPayment("qris")}
                                className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${selectedPayment === "qris"
                                    ? "border-primary-500 bg-primary-50 text-primary-700"
                                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                                    }`}
                            >
                                <QrCode className="h-4 w-4" />
                                QRIS
                            </button>
                            <button
                                onClick={() => setSelectedPayment("transfer")}
                                className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${selectedPayment === "transfer"
                                    ? "border-primary-500 bg-primary-50 text-primary-700"
                                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                                    }`}
                            >
                                <CreditCard className="h-4 w-4" />
                                Transfer
                            </button>
                        </div>
                    </div>

                    {/* Hold Order Button - Always Visible */}
                    <button
                        onClick={() => cart.length > 0 ? setShowHoldOrderModal(true) : alert("Keranjang kosong!")}
                        className="mb-3 w-full rounded-lg border-2 border-secondary-400 bg-white py-2.5 text-sm font-semibold text-secondary-600 transition-colors hover:bg-secondary-50 hover:border-secondary-500"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Package className="h-4 w-4" />
                            Tahan Pesanan
                        </div>
                    </button>

                    {/* Checkout Button */}
                    <button
                        onClick={() => setShowCheckoutModal(true)}
                        disabled={cart.length === 0 || isCheckingOut}
                        className="w-full rounded-lg bg-primary-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isCheckingOut ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            `Bayar ${formatPrice(getTotal())}`
                        )}
                    </button>
                </div>
            </div>

            {/* Checkout Confirmation Modal */}
            {showCheckoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-zinc-900">
                                Konfirmasi Pembayaran
                            </h3>
                            <button
                                onClick={() => setShowCheckoutModal(false)}
                                className="text-zinc-400 hover:text-zinc-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-6 space-y-3 rounded-lg bg-zinc-50 p-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-600">Total Item</span>
                                <span className="font-medium">{cart.reduce((sum, i) => sum + i.quantity, 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-600">Metode Pembayaran</span>
                                <span className="font-medium capitalize">{selectedPayment}</span>
                            </div>
                            {getTax() > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-600">{taxSettings.name} ({taxSettings.isInclusive ? "Termasuk" : `${taxSettings.rate}%`})</span>
                                    <span className="font-medium">{formatPrice(getTax())}</span>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-zinc-200 pt-3 text-lg font-bold">
                                <span>Total</span>
                                <span className="text-primary-600">{formatPrice(getTotal())}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowCheckoutModal(false)}
                            className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
                        >
                            {isCheckingOut ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4" />
                            )}
                            Konfirmasi
                        </button>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {checkoutSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-zinc-900">
                            Transaksi Berhasil!
                        </h3>
                        <p className="mb-4 text-sm text-zinc-500">
                            Invoice: <span className="font-mono font-medium">{lastInvoice}</span>
                        </p>
                        <button
                            onClick={() => setCheckoutSuccess(false)}
                            className="w-full rounded-lg bg-primary-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
                        >
                            Transaksi Baru
                        </button>
                    </div>
                </div>
            )
            }

            {/* Hold Order Modal */}
            {
                showHoldOrderModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-zinc-200 bg-gradient-to-r from-secondary-400 to-secondary-500 p-6">
                                <div>
                                    <h3 className="text-xl font-bold text-primary-950">Tahan Pesanan</h3>
                                    <p className="text-sm text-primary-100">Simpan untuk dilanjutkan nanti</p>
                                </div>
                                <button
                                    onClick={() => setShowHoldOrderModal(false)}
                                    className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Order Summary */}
                                <div className="mb-6 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 p-5 border border-primary-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Item</p>
                                            <p className="text-2xl font-black text-primary-700">{cart.length}</p>
                                        </div>
                                        <div className="rounded-xl bg-secondary-500 px-4 py-2 shadow-sm">
                                            <p className="text-xl font-black text-primary-950">{formatPrice(getTotal())}</p>
                                        </div>
                                    </div>

                                    {/* Items Preview */}
                                    {cart.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            {cart.slice(0, 3).map((item) => (
                                                <div key={item.id} className="flex items-center justify-between text-sm">
                                                    <span className="text-zinc-700">
                                                        {item.name} ×{item.quantity}
                                                    </span>
                                                    <span className="font-medium text-zinc-900">
                                                        {formatPrice(parseFloat(item.price) * item.quantity)}
                                                    </span>
                                                </div>
                                            ))}
                                            {cart.length > 3 && (
                                                <p className="text-xs text-zinc-500">
                                                    +{cart.length - 3} item lainnya
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                <div className="mb-6">
                                    <label className="mb-2 block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                        Catatan (Opsional)
                                    </label>
                                    <textarea
                                        value={holdOrderNotes}
                                        onChange={(e) => setHoldOrderNotes(e.target.value)}
                                        placeholder="Contoh: Pelanggan menunggu, untuk to-go, dll..."
                                        rows={3}
                                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowHoldOrderModal(false)}
                                        className="flex-1 rounded-lg border border-zinc-200 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleHoldOrder}
                                        disabled={isProcessingHold}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-secondary-400 to-secondary-500 py-3 text-sm font-semibold text-primary-950 transition-all hover:from-secondary-500 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isProcessingHold ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Package className="h-4 w-4" />
                                        )}
                                        {isProcessingHold ? "Menyimpan..." : "Tahan Pesanan"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Held Orders Modal */}
            {
                showHeldOrdersModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-zinc-200 bg-gradient-to-r from-primary-600 to-primary-500 p-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Pesanan Ditahan</h3>
                                    <p className="text-sm text-primary-100">{heldOrders.length} pesanan aktif</p>
                                </div>
                                <button
                                    onClick={() => setShowHeldOrdersModal(false)}
                                    className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto p-6">
                                {heldOrders.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                                        <Package className="mb-4 h-16 w-16" />
                                        <p className="font-medium">Belum ada pesanan ditahan</p>
                                        <p className="text-sm">Pesanan akan muncul di sini</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {heldOrders.map((heldOrder) => (
                                            <div
                                                key={heldOrder.id}
                                                className="overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md"
                                            >
                                                {/* Order Header */}
                                                <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 p-4">
                                                    <div>
                                                        <p className="text-xs text-zinc-500">
                                                            {new Date(heldOrder.createdAt).toLocaleDateString("id-ID", {
                                                                day: "numeric",
                                                                month: "short",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </p>
                                                        {heldOrder.customerName && (
                                                            <p className="text-sm font-medium text-zinc-900">
                                                                {heldOrder.customerName}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700">
                                                            {heldOrder.items.length} item
                                                        </span>
                                                        <button
                                                            onClick={() => handleDeleteHeldOrder(heldOrder.id)}
                                                            className="rounded-lg bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Order Body */}
                                                <div className="p-4">
                                                    <div className="mb-3">
                                                        <p className="mb-2 text-xs text-zinc-500 uppercase tracking-wider font-semibold">Item</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {heldOrder.items.slice(0, 5).map((item: any, idx: number) => (
                                                                <span
                                                                    key={idx}
                                                                    className="rounded-lg bg-zinc-50 border border-zinc-200 px-2 py-1 text-xs text-zinc-700"
                                                                >
                                                                    {item.name} ×{item.quantity}
                                                                </span>
                                                            ))}
                                                            {heldOrder.items.length > 5 && (
                                                                <span className="rounded-lg bg-primary-50 border border-primary-200 px-2 py-1 text-xs font-medium text-primary-700">
                                                                    +{heldOrder.items.length - 5} lainnya
                                                                </span>
                                                            )}
                                                        </div>
                                                        {heldOrder.notes && (
                                                            <div className="mt-3 flex items-start gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                                                                <Package className="mt-0.5 h-4 w-4 text-yellow-600" />
                                                                <p className="text-xs text-zinc-600 italic">
                                                                    "{heldOrder.notes}"
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Order Footer */}
                                                    <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                                                        <div>
                                                            <p className="text-xs text-zinc-500">Total</p>
                                                            <p className="text-lg font-bold text-primary-700">
                                                                {formatPrice(heldOrder.totalAmount)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleResumeOrder(heldOrder)}
                                                            className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
                                                        >
                                                            <Package className="h-4 w-4" />
                                                            Lanjutkan
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
