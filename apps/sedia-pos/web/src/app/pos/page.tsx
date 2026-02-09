"use client";

import { useState, useEffect, useRef } from "react";
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
    Maximize2,
    LogOut,
    User,
    Printer,
    Share2,
    History,
    FileText,
    Calculator,
    Star,
    Coins,
    ArrowRightLeft,
    Wallet,
    Smartphone,
    Link as LinkIcon,
    Copy,
    Clock,
    Pause,
    Play,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getOutlets } from "@/actions/outlets";
import { getProducts, getCategories } from "../dashboard/products/actions";
import { ToastProvider, useToast } from "@/components/Toast";
import { ReceiptTemplate } from "@/components/receipts/ReceiptTemplate";
import ManagerAuthModal from "@/components/ManagerAuthModal";
import { useSession } from "@/lib/auth-client";

function ProductImage({ src, alt, className, iconSize = "h-8 w-8" }: { src?: string | null; alt: string; className?: string; iconSize?: string }) {
    const [error, setError] = useState(!src);

    if (error || !src) {
        return (
            <div className={`flex items-center justify-center bg-zinc-100 ${className}`}>
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

interface Variant {
    id: string;
    name: string;
    type: string;
    priceAdjustment: string | null;
    stock: number | null;
    isActive: boolean | null;
}

interface Product {
    id: string;
    name: string;
    sku: string | null;
    price: string;
    stock: number | null;
    isActive?: boolean | null;
    imageUrl?: string | null;
    variants?: Variant[];
}

interface CartItem extends Product {
    quantity: number;
    variantId?: string;
    variantName?: string;
}

interface Customer {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    points: number;
    tierId: string | null;
}

interface MemberTier {
    id: string;
    name: string;
    discountPercent: string;
    minPoints: number;
    color: string;
}

export default function FullscreenPOSPage() {
    return (
        <ToastProvider>
            <POSContent />
        </ToastProvider>
    );
}

function formatPaymentMethodName(method: string): string {
    if (!method) return '';
    if (method.startsWith('midtrans_va_')) {
        return `Transfer ${method.replace('midtrans_va_', '').toUpperCase()} (VA)`;
    }
    if (method === 'midtrans_qris') return 'QRIS';
    return method;
}

function POSContent() {
    const { showToast } = useToast();
    const { data: session } = useSession();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOutletId, setSelectedOutletId] = useState("");
    const [selectedPayment, setSelectedPayment] = useState<string>("cash");
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [lastInvoice, setLastInvoice] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);
    const [showManagerAuth, setShowManagerAuth] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<"delete_item" | "clear_cart" | null>(null);

    // Dynamic role from session
    const currentRole = (session?.user as any)?.role || "cashier";

    // Customer selection
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [memberTiers, setMemberTiers] = useState<MemberTier[]>([]);

    // Receipt Printing
    const [outlets, setOutlets] = useState<any[]>([]);
    const [lastTransaction, setLastTransaction] = useState<any>(null);
    const [appliedPayments, setAppliedPayments] = useState<any[]>([]);
    const [isSplitMode, setIsSplitMode] = useState(false);
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([]);

    // QRIS Logic
    const [qrisString, setQrisString] = useState("");
    const [showQrisModal, setShowQrisModal] = useState(false);
    const [selectedBank, setSelectedBank] = useState("");
    const [vaNumber, setVaNumber] = useState("");
    const [billerCode, setBillerCode] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("pending");
    const [debugData, setDebugData] = useState<any>(null);
    const [selectedManualAccount, setSelectedManualAccount] = useState<any>(null);

    // Shift Management
    const [activeShift, setActiveShift] = useState<any>(null);
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
    const [shiftReconciliation, setShiftReconciliation] = useState<any>(null);
    const [startingCash, setStartingCash] = useState<string>("0");
    const [endingCash, setEndingCash] = useState<string>("0");
    const [shiftNotes, setShiftNotes] = useState<string>("");
    const [isProcessingShift, setIsProcessingShift] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

    // Held Orders
    const [heldOrders, setHeldOrders] = useState<any[]>([]);
    const [showHoldOrderModal, setShowHoldOrderModal] = useState(false);
    const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
    const [holdOrderNotes, setHoldOrderNotes] = useState("");
    const [isProcessingHold, setIsProcessingHold] = useState(false);
    const [resumedOrderId, setResumedOrderId] = useState<string | null>(null);

    // Tax Settings
    const [taxSettings, setTaxSettings] = useState<any>(null);

    // Variant Modal
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);

    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (showQrisModal && lastInvoice && (selectedPayment === 'qris' || selectedPayment === 'transfer')) {
            const findType = (id: string) => {
                const m = (availablePaymentMethods.length > 0 ? availablePaymentMethods : [
                    { id: "cash", type: "cash", name: "Cash" },
                    { id: "qris", type: "qris", name: "QRIS" },
                    { id: "transfer", type: "transfer", name: "Transfer" },
                ]).find(method => method.id === id);
                return m?.type || "cash";
            };
            const activeType = findType(selectedPayment);
            const m = availablePaymentMethods.find(method => method.id === selectedPayment);

            // Only poll for integrated payments
            const isIntegrated = activeType === 'qris' ? !m?.qrisData : (activeType === 'transfer' ? (!m?.isManual && (!m?.bankAccounts || m.bankAccounts.length === 0)) : false);

            if (isIntegrated) {
                pollingRef.current = setInterval(async () => {
                    const isPaid = await checkPaymentStatus(lastInvoice);
                    if (isPaid) {
                        if (pollingRef.current) clearInterval(pollingRef.current);
                        setShowQrisModal(false);
                        const pMethod = activeType === 'transfer' ? `midtrans_va_${selectedBank || 'bca'}` : 'midtrans_qris';
                        completeCheckout(lastInvoice, 'paid', pMethod);
                    }
                }, 3000);
            }
        }
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, [showQrisModal, lastInvoice, selectedPayment, vaNumber, selectedBank, availablePaymentMethods]);

    const checkPaymentStatus = async (orderId: string) => {
        try {
            const res = await fetch(`/api/payment/midtrans/status/${orderId}`);
            const data = await res.json();
            if (data.transaction_status === 'settlement' || data.transaction_status === 'capture') {
                return true;
            }
            return false;
        } catch (e) {
            console.error("Status check failed", e);
            return false;
        }
    };

    // Unified polling handled via useEffect above

    // Ref for interval
    const pollingIntervalRef = useState<NodeJS.Timeout | null>(null); // Hacky using state as ref holder or just useRef?
    // page.tsx is a Client Component so useRef works.
    // But I can't import useRef if not imported.
    // I need to add useRef to imports.
    // Let's assume I can add it or just use `window.setInterval`?
    // Let's modify imports first if I need useRef.
    // Or just use a simple useEffect in a sub-component?
    // I will write a simple polling loop inside `handleCheckout`? No, async loop blocks.

    // Let's proceed with adding `useRef` to imports in next step or now if possible.
    // I will use `useEffect` for polling when `showQrisModal` is true.

    // Manual Print Handler
    const handlePrint = () => {
        if (!lastTransaction) return;

        // Map payment IDs to names for the receipt
        // Map payment IDs to names for the receipt (already done in lastTransaction, but fallback here)
        const mappedPayments = lastTransaction.payments?.map((p: any) => ({
            method: p.paymentMethod, // Should be name now
            amount: p.amount
        }));

        // Get outlet info
        const currentOutlet = outlets.find(o => o.id === selectedOutletId);

        // Structure print data to match expected format { transaction, outlet, customer }
        const printData = {
            transaction: {
                ...lastTransaction,
                items: lastTransaction.items?.map((item: any) => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: parseFloat(item.price) || 0,
                    total: (parseFloat(item.price) || 0) * item.quantity,
                    variant: item.variantName
                })),
                paymentDetails: mappedPayments,
                paymentMethod: availablePaymentMethods.find(m => m.id === lastTransaction.paymentMethod)?.name || lastTransaction.paymentMethod,
            },
            outlet: currentOutlet ? {
                name: currentOutlet.name,
                address: currentOutlet.address,
                phone: currentOutlet.phone,
            } : null,
            customer: selectedCustomer ? {
                name: selectedCustomer.name,
            } : null,
        };
        localStorage.setItem("print_receipt_data", JSON.stringify(printData));
        window.open(
            "/print-receipt",
            "PrintReceipt",
            "width=400,height=600"
        );
    };

    const fetchOutlets = async () => {
        try {
            const outletsData = await getOutlets();
            setOutlets(outletsData);
            if (outletsData.length > 0 && !selectedOutletId) {
                setSelectedOutletId(outletsData[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch outlets:", error);
        }
    };

    const loadOutletData = async (outletId: string) => {
        if (!outletId) return;
        setIsLoading(true);
        try {
            const [
                productsRes,
                categoriesRes,
                customersRes,
                shiftRes,
                employeesRes,
                tiersRes,
                paymentsRes,
                taxRes
            ] = await Promise.all([
                getProducts(outletId),
                getCategories(outletId),
                fetch(`/api/customers?outletId=${outletId}`),
                fetch(`/api/shifts?outletId=${outletId}&status=open`),
                fetch(`/api/employees?outletId=${outletId}`),
                fetch(`/api/loyalty/tiers?outletId=${outletId}`),
                fetch(`/api/outlets/${outletId}/payment-methods`),
                fetch(`/api/tax-settings?outletId=${outletId}`)
            ]);

            if (productsRes.data) {
                setProducts(productsRes.data.filter((p: any) => p.isActive && p.stock > 0));
            }

            if (categoriesRes.data) {
                setCategories(categoriesRes.data);
            }

            if (customersRes.ok) {
                setCustomers(await customersRes.json());
            }

            if (shiftRes.ok) {
                const shifts = await shiftRes.json();
                if (shifts.length > 0) {
                    setActiveShift(shifts[0].shift);
                    setSelectedEmployeeId(shifts[0].shift.employeeId);
                } else {
                    setActiveShift(null);
                    setShowShiftModal(true);
                }
            }

            if (employeesRes.ok) {
                let employeesData = await employeesRes.json();
                if (session?.user && !employeesData.some((e: any) => e.userId === session.user.id)) {
                    employeesData = [
                        {
                            id: `user-${session.user.id}`,
                            name: `${session.user.name} (Anda)`,
                            userId: session.user.id,
                            role: (session.user as any).role || 'manager'
                        },
                        ...employeesData
                    ];
                }
                setEmployees(employeesData);
            }

            if (tiersRes.ok) {
                setMemberTiers(await tiersRes.json());
            }

            if (paymentsRes.ok) {
                setAvailablePaymentMethods(await paymentsRes.json());
            }

            if (taxRes.ok) {
                setTaxSettings(await taxRes.json());
            }
        } catch (error) {
            console.error("Failed to load outlet data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOutlets();
    }, []);

    useEffect(() => {
        if (selectedOutletId) {
            loadOutletData(selectedOutletId);
            fetchHeldOrders();
        }
    }, [selectedOutletId]);

    // Polling Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showQrisModal && lastInvoice) {
            interval = setInterval(async () => {
                const isPaid = await checkPaymentStatus(lastInvoice);
                if (isPaid) {
                    setPaymentStatus("settlement");
                    setShowQrisModal(false);
                    completeCheckout(lastInvoice, 'paid');
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [showQrisModal, lastInvoice]);

    const handleOpenShift = async () => {
        if (!selectedEmployeeId || !selectedOutletId) {
            showToast("Error", "Pilih karyawan terlebih dahulu", "error");
            return;
        }

        setIsProcessingShift(true);
        try {
            const res = await fetch("/api/shifts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    outletId: selectedOutletId,
                    employeeId: selectedEmployeeId,
                    startingCash: parseFloat(startingCash || "0")
                })
            });

            if (res.ok) {
                const newShift = await res.json();
                setActiveShift(newShift);
                setShowShiftModal(false);
                showToast("Shift Dibuka", "Selamat bekerja!", "success");
            } else {
                const data = await res.json();
                showToast("Gagal", data.error || "Gagal buka shift", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Error", "Gagal menghubungi server", "error");
        } finally {
            setIsProcessingShift(false);
        }
    };

    const handleCloseShift = async () => {
        if (!activeShift) return;

        setIsProcessingShift(true);
        try {
            const res = await fetch(`/api/shifts/${activeShift.id}/close`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    endingCash: parseFloat(endingCash || "0"),
                    notes: shiftNotes
                })
            });

            if (res.ok) {
                const data = await res.json();
                setShiftReconciliation(data);
                setShowCloseShiftModal(false);
                setActiveShift(null);
                setEndingCash("0");
                setShiftNotes("");
                showToast("Shift Ditutup", "Rekonsiliasi berhasil", "success");
            } else {
                const data = await res.json();
                showToast("Gagal", data.error || "Gagal tutup shift", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Error", "Gagal menghubungi server", "error");
        } finally {
            setIsProcessingShift(false);
        }
    };

    const addToCart = (product: Product, variant?: Variant) => {
        const itemId = variant ? `${product.id}-${variant.id}` : product.id;
        const stockToCheck = (variant ? variant.stock : product.stock) ?? 0;
        const itemName = variant ? `${product.name} (${variant.name})` : product.name;
        const itemPrice = variant
            ? (parseFloat(product.price) + parseFloat(variant.priceAdjustment || "0")).toString()
            : product.price;

        // Check variants first if any and not selected
        if (!variant && product.variants && product.variants.length > 0) {
            setSelectedProductForVariant(product);
            setShowVariantModal(true);
            return;
        }

        // Check stock first
        const existing = cart.find((item) =>
            variant
                ? (item.id === product.id && item.variantId === variant.id)
                : (item.id === product.id && !item.variantId)
        );

        if (existing && existing.quantity >= (stockToCheck)) {
            showToast("Stok Habis", `Stok ${itemName} tidak cukup!`, "warning");
            return;
        }

        setCart((prev) => {
            const existingItem = prev.find((item) =>
                variant
                    ? (item.id === product.id && item.variantId === variant.id)
                    : (item.id === product.id && !item.variantId)
            );

            if (existingItem) {
                return prev.map((item) => {
                    const isMatch = variant
                        ? (item.id === product.id && item.variantId === variant.id)
                        : (item.id === product.id && !item.variantId);
                    return isMatch
                        ? { ...item, quantity: item.quantity + 1 }
                        : item;
                });
            }

            return [...prev, {
                ...product,
                price: itemPrice,
                quantity: 1,
                variantId: variant?.id,
                variantName: variant?.name
            }];
        });

        // Clear previous payments if any, as total changed
        setAppliedPayments([]);
        setShowVariantModal(false);
        setSelectedProductForVariant(null);
    };

    const updateQuantity = (productId: string, delta: number) => {
        // Check stock first (outside of setCart to avoid setState during render)
        const item = cart.find((i) => i.id === productId);
        if (!item) return;

        const newQty = item.quantity + delta;

        // If qty would become 0, use removeFromCart (which checks manager auth)
        if (newQty <= 0) {
            removeFromCart(productId);
            return;
        }

        if (newQty > (item.stock ?? 0)) {
            showToast("Stok Habis", "Stok tidak cukup!", "warning");
            return;
        }

        setCart((prev) =>
            prev.map((i) =>
                i.id === productId ? { ...i, quantity: newQty } : i
            )
        );
        // Clear previous payments if any
        setAppliedPayments([]);
    };

    const removeFromCart = (productId: string) => {
        // If cashier, require manager auth
        const isCashier = currentRole.toLowerCase() === "cashier" || currentRole.toLowerCase() === "kasir";
        if (isCashier) {
            setPendingDeleteId(productId);
            setPendingAction("delete_item");
            setShowManagerAuth(true);
            return;
        }
        // Manager/Owner can delete directly
        showToast("Item Dihapus", "Produk berhasil dihapus dari keranjang.", "success");
        setCart((prev) => prev.filter((item) => item.id !== productId));
        setAppliedPayments([]);
    };

    const handleManagerAuthSuccess = () => {
        setShowManagerAuth(false);
        if (pendingAction === "delete_item" && pendingDeleteId) {
            showToast("Item Dihapus", "Produk berhasil dihapus dari keranjang.", "success");
            setCart((prev) => prev.filter((item) => item.id !== pendingDeleteId));
            setPendingDeleteId(null);
            setPendingAction(null);
            setAppliedPayments([]);
        } else if (pendingAction === "clear_cart") {
            showToast("Keranjang Direset", "Semua item telah dihapus.", "success");
            setCart([]);
            setResumedOrderId(null);
            setPendingAction(null);
            setAppliedPayments([]);
        }
    };

    const clearCart = () => {
        // If cashier, require manager auth
        const isCashier = currentRole.toLowerCase() === "cashier" || currentRole.toLowerCase() === "kasir";
        if (isCashier) {
            setPendingAction("clear_cart");
            setShowManagerAuth(true);
            return;
        }

        setCart([]);
        setResumedOrderId(null);
        setAppliedPayments([]);
    };

    const getSubtotal = () => cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

    const getMemberDiscount = () => {
        if (!selectedCustomer?.tierId) return 0;
        const tier = memberTiers.find(t => t.id === selectedCustomer.tierId);
        if (!tier) return 0;
        const discountPercent = parseFloat(tier.discountPercent) || 0;
        return (getSubtotal() * discountPercent) / 100;
    };

    const getTax = () => {
        if (!taxSettings || !taxSettings.isEnabled) return 0;

        const subtotal = getSubtotal();
        const discount = getMemberDiscount();
        const taxableAmount = subtotal - discount;
        const rate = parseFloat(taxSettings.rate || "0");

        let calculatedTax = 0;
        if (taxSettings.isInclusive) {
            // Price = Base + (Base * Rate) -> Price = Base * (1 + Rate)
            // Tax = Price - [Price / (1 + Rate)]
            calculatedTax = taxableAmount - (taxableAmount / (1 + rate / 100));
        } else {
            // Exclusive: Tax is added on top
            calculatedTax = (taxableAmount * rate) / 100;
        }

        // console.log("getTax:", { taxableAmount, rate, isInclusive: taxSettings.isInclusive, calculatedTax });
        return calculatedTax;
    };

    const getTotal = () => {
        const subtotal = getSubtotal();
        const discount = getMemberDiscount();
        const tax = getTax();

        // Base total (after discount)
        let total = subtotal - discount;

        // If tax is exclusive, add it to the total.
        // If inclusive, it's already in the subtotal, so we don't add it again.
        if (taxSettings?.isEnabled && !taxSettings.isInclusive) {
            total += tax;
        }

        // console.log("getTotal:", { subtotal, discount, tax, total, isEnabled: taxSettings?.isEnabled, isInclusive: taxSettings?.isInclusive });
        return total;
    };

    const addPayment = (methodId: string) => {
        const total = getTotal();
        const paid = appliedPayments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = total - paid;

        if (remaining <= 0 && isSplitMode) {
            alert("Tagihan sudah terpenuhi");
            return;
        }

        // Find the method to get its type
        const method = (availablePaymentMethods.length > 0 ? availablePaymentMethods : [
            { id: "cash", type: "cash", name: "Cash" },
            { id: "qris", type: "qris", name: "QRIS" },
            { id: "transfer", type: "transfer", name: "Transfer" },
        ]).find(m => m.id === methodId);

        const methodType = method?.type || "cash";

        // Default to remaining balance
        const newPayment = {
            paymentMethod: methodId,
            amount: remaining > 0 ? remaining : total,
            bank: methodType === 'transfer' ? selectedBank || 'bca' : undefined,
            manualAccount: (methodType === 'transfer' && (method?.isManual || (method?.bankAccounts && method?.bankAccounts?.length > 0))) ? selectedManualAccount : undefined,
            type: methodType
        };

        if (isSplitMode) {
            setAppliedPayments([...appliedPayments, newPayment]);
        } else {
            setAppliedPayments([newPayment]);
        }
        setSelectedPayment(methodId);

        // Reset sub-selection states when changing root method
        setSelectedManualAccount(null);
        setSelectedBank("");
        setBillerCode("");
        setVaNumber("");
        setQrisString("");
        setPaymentStatus("pending");
    };

    const removePayment = (index: number) => {
        const newPayments = [...appliedPayments];
        newPayments.splice(index, 1);
        setAppliedPayments(newPayments);
        if (newPayments.length === 0) {
            setSelectedPayment("cash");
        } else {
            setSelectedPayment(newPayments[newPayments.length - 1].paymentMethod);
        }
    };

    const getRemainingBalance = () => {
        const paid = appliedPayments.reduce((sum, p) => sum + p.amount, 0);
        return getTotal() - paid;
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
        if (cart.length === 0) return;

        const invoiceNumber = generateInvoiceNumber();

        // Determine active payment method for processing
        let activePaymentMethod = selectedPayment;
        let activeType = "cash";

        // Find selected method's type
        const findType = (id: string) => {
            const m = (availablePaymentMethods.length > 0 ? availablePaymentMethods : [
                { id: "cash", type: "cash", name: "Cash" },
                { id: "qris", type: "qris", name: "QRIS" },
                { id: "transfer", type: "transfer", name: "Transfer" },
            ]).find(method => method.id === id);
            return m?.type || "cash";
        };

        activeType = findType(selectedPayment);

        if (isSplitMode && appliedPayments.length > 0) {
            const electronicPayment = appliedPayments.find(p => p.type === 'qris' || p.type === 'transfer');
            if (electronicPayment) {
                activePaymentMethod = electronicPayment.paymentMethod;
                activeType = electronicPayment.type;
            }
        }

        const methodObj = (availablePaymentMethods.length > 0 ? availablePaymentMethods : [
            { id: "cash", type: "cash", name: "Cash" },
            { id: "qris", type: "qris", name: "QRIS" },
            { id: "transfer", type: "transfer", name: "Transfer" },
        ]).find(m => m.id === activePaymentMethod);

        // QRIS or Transfer (VA) Flow
        if (activeType === 'qris' || activeType === 'transfer') {
            // Check if it's manual
            if (methodObj?.isManual || methodObj?.bankAccounts?.length > 0 || methodObj?.qrisData) {
                // Manual flow
                setLastInvoice(invoiceNumber);
                setShowQrisModal(true);
                setPaymentStatus("pending");
                setShowCheckoutModal(false);
                return;
            }

            setIsCheckingOut(true);
            try {
                const orderId = invoiceNumber;

                // Determine payload
                const splitEntry = appliedPayments.find(p => p.paymentMethod === activePaymentMethod);
                const paymentAmount = splitEntry ? splitEntry.amount : getTotal();
                const payload: any = {
                    orderId,
                    amount: paymentAmount,
                    paymentType: activeType === 'qris' ? 'qris' : 'bank_transfer'
                };

                if (activeType === 'transfer') {
                    // Use stored bank if available (for split payment), otherwise global selectedBank
                    payload.bank = splitEntry?.bank || selectedBank || 'bca';
                }

                const res = await fetch("/api/payment/midtrans/charge", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const errorText = await res.text();
                    let errorMessage = `HTTP Error ${res.status}`;
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson.error || errorJson.message || errorText;
                        if (errorJson.details) errorMessage += `: ${errorJson.details}`;
                    } catch (e) {
                        errorMessage = errorText; // Use raw text if not JSON
                    }
                    throw new Error(errorMessage);
                }

                const data = await res.json();
                setDebugData(data);

                let success = false;

                // Handle QRIS
                if (activeType === 'qris') {
                    const qr = data.qr_string || (data.actions && data.actions.find((a: any) => a.name === 'generate-qr-code')?.url);
                    if (qr) {
                        setQrisString(qr);
                        setVaNumber(""); // Clear VA
                        success = true;
                    }
                }

                // Handle VA (Bank Transfer)
                if (activeType === 'transfer') {
                    // Check for VA number or Mandiri bill key
                    const va = data.va_numbers?.[0]?.va_number || data.permata_va_number || data.bill_key;
                    if (va) {
                        setVaNumber(va);
                        setBillerCode(data.biller_code || "");
                        setQrisString(""); // Clear QR
                        success = true;
                    }
                }

                if (success) {
                    setLastInvoice(orderId);
                    setShowQrisModal(true);
                    setPaymentStatus("pending");
                    setShowCheckoutModal(false);
                } else {
                    alert("Gagal generate Payment: " + (data.error || "Unknown error"));
                }
            } catch (e) {
                console.error(e);
                alert("Error Payment Processing");
            } finally {
                setIsCheckingOut(false);
            }
            return;
        }

        // Standard Checkout
        await completeCheckout(invoiceNumber, "paid");
    };

    const completeCheckout = async (invoiceNumber: string, pStatus: string, forcedMethod?: string) => {
        setIsCheckingOut(true);

        const findType = (id: string) => {
            const m = (availablePaymentMethods.length > 0 ? availablePaymentMethods : [
                { id: "cash", type: "cash", name: "Cash" },
                { id: "qris", type: "qris", name: "QRIS" },
                { id: "transfer", type: "transfer", name: "Transfer" },
            ]).find(method => method.id === id);
            return m?.type || "cash";
        };

        const activeType = findType(selectedPayment);

        // Enhance payment method if single integrated
        let finalMethod = appliedPayments.length > 1 ? "Split" : (forcedMethod || selectedPayment);
        const selectedMethodObj = (availablePaymentMethods.length > 0 ? availablePaymentMethods : [
            { id: "cash", type: "cash", name: "Cash" },
            { id: "qris", type: "qris", name: "QRIS" },
            { id: "transfer", type: "transfer", name: "Transfer" },
        ]).find(m => m.id === selectedPayment);

        if (!isSplitMode && !forcedMethod) {
            if (activeType === 'transfer' && !selectedMethodObj?.isManual && (!selectedMethodObj?.bankAccounts || selectedMethodObj.bankAccounts.length === 0)) {
                finalMethod = `midtrans_va_${selectedBank || 'bca'}`;
            } else if (activeType === 'qris' && !selectedMethodObj?.qrisData) {
                finalMethod = 'midtrans_qris';
            }
        }

        try {
            const transactionData = {
                outletId: selectedOutletId,
                invoiceNumber,
                cashierId: activeShift?.employeeId || null,
                items: cart.map((item) => ({
                    productId: item.id,
                    productName: item.variantName ? `${item.name} (${item.variantName})` : item.name,
                    productSku: item.sku,
                    quantity: item.quantity,
                    price: parseFloat(item.price),
                    total: parseFloat(item.price) * item.quantity,
                    variantId: item.variantId,
                    variantName: item.variantName
                })),
                subtotal: getSubtotal(),
                discount: getMemberDiscount(),
                tax: getTax(),
                taxName: taxSettings?.name || null,
                totalAmount: getTotal(),
                customerId: selectedCustomer?.id || null,
                paymentMethod: finalMethod,
                paymentStatus: pStatus,
                status: "completed",
                midtransId: (activeType === 'qris' || activeType === 'transfer') ? invoiceNumber : undefined,
                payments: appliedPayments.length > 0 ? appliedPayments.map(p => {
                    let pMethod = p.paymentMethod;
                    const mObj = availablePaymentMethods.find(m => m.id === p.paymentMethod);
                    if (p.type === 'transfer' && !mObj?.isManual && (!mObj?.bankAccounts || mObj.bankAccounts.length === 0) && !pMethod.startsWith('midtrans_va_')) {
                        pMethod = `midtrans_va_${p.bank || selectedBank || 'bca'}`;
                    } else if (p.type === 'qris' && !mObj?.qrisData && pMethod === 'qris') {
                        pMethod = 'midtrans_qris';
                    }
                    return {
                        paymentMethod: pMethod,
                        amount: p.amount
                    };
                }) : [{
                    paymentMethod: finalMethod,
                    amount: getTotal()
                }]
            };

            const res = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transactionData),
            });

            if (res.ok) {
                const result = await res.json();
                const currentTransaction = {
                    ...transactionData,
                    items: cart, // Keep cart items structure for receipt
                    createdAt: new Date().toLocaleDateString('id-ID'), // Simple date for receipt
                    pointsEarned: result.earnedPoints || 0,
                    // Enrich for Receipt (Use Names)
                    paymentMethod: activeType === 'qris' ? 'QRIS' : (activeType === 'transfer' ? 'Transfer' : (selectedMethodObj?.name || finalMethod)),
                    payments: appliedPayments.length > 0 ? appliedPayments.map(p => {
                        const m = (availablePaymentMethods.length > 0 ? availablePaymentMethods : [
                            { id: "cash", type: "cash", name: "Cash" },
                            { id: "qris", type: "qris", name: "QRIS" },
                            { id: "transfer", type: "transfer", name: "Transfer" },
                        ]).find(m => m.id === p.paymentMethod);
                        return {
                            paymentMethod: m?.name || p.paymentMethod, // Use Name for Receipt
                            amount: p.amount
                        };
                    }) : [{
                        paymentMethod: selectedMethodObj?.name || finalMethod,
                        amount: getTotal()
                    }]
                };
                setLastTransaction(currentTransaction);

                setLastInvoice(result.invoiceNumber || invoiceNumber);
                setCheckoutSuccess(true);
                setCart([]);
                setAppliedPayments([]);
                setIsSplitMode(false);
                setSelectedCustomer(null);
                const productsRes = await getProducts(selectedOutletId);
                if (productsRes.data) {
                    setProducts(productsRes.data.filter((p: any) => p.isActive && p.stock > 0));
                }

                // If this was a resumed held order, mark it as completed on backend
                if (resumedOrderId) {
                    console.log("Marking held order as completed:", resumedOrderId);
                    fetch(`/api/held-orders/${resumedOrderId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: 'completed' }),
                    }).catch(err => console.error("Error completing held order:", err));
                    setResumedOrderId(null);
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
            setShowQrisModal(false);
        }
    };

    const filteredProducts = products.filter((p: any) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
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
            showToast("Error", "Keranjang kosong!", "error");
            return;
        }
        if (!selectedOutletId) {
            showToast("Error", "Outlet belum dipilih!", "error");
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
                showToast("Berhasil", "Pesanan berhasil ditahan!", "success");
            } else {
                const error = await res.json();
                showToast("Gagal", `Gagal menahan pesanan: ${error.error || "Unknown error"}`, "error");
            }
        } catch (error) {
            console.error("Failed to hold order:", error);
            showToast("Error", "Terjadi kesalahan saat menahan pesanan.", "error");
        } finally {
            setIsProcessingHold(false);
        }
    };

    const handleResumeOrder = async (heldOrder: any) => {
        const proceed = () => {
            setCart(heldOrder.items);
            setResumedOrderId(heldOrder.id);
            // Optimistic update: hide from list while being resumed
            setHeldOrders((prev) => prev.filter((h) => h.id !== heldOrder.id));
            setShowHeldOrdersModal(false);

            showToast("Berhasil", "Pesanan dilanjutkan!", "success");
        };

        if (cart.length > 0) {
            if (confirm("Keranjang saat ini akan digantikan dengan pesanan yang ditahan. Lanjutkan?")) {
                proceed();
            }
        } else {
            proceed();
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
                showToast("Berhasil", "Pesanan berhasil dihapus.", "success");
            } else {
                showToast("Gagal", "Gagal menghapus pesanan.", "error");
            }
        } catch (error) {
            console.error("Failed to delete held order:", error);
            showToast("Error", "Terjadi kesalahan.", "error");
        }
    };


    // Fetch held orders when outlet changes
    useEffect(() => {
        if (selectedOutletId) {
            fetchHeldOrders();
        }
    }, [selectedOutletId]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
                <div className="text-center">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-500" />
                    <p className="mt-4 text-primary-600">Memuat data kasir...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-primary-100 bg-white px-6 py-4 shadow-sm">
                <div className="flex items-center gap-6">
                    {/* Brand Icon */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/20">
                        <ShoppingCart className="h-6 w-6 text-white" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            {outlets.length > 1 ? (
                                <div className="relative group">
                                    <select
                                        value={selectedOutletId}
                                        onChange={(e) => setSelectedOutletId(e.target.value)}
                                        className="appearance-none text-2xl font-black text-primary-950 bg-transparent pr-8 focus:outline-none cursor-pointer hover:text-primary-700 transition-colors"
                                    >
                                        {outlets.map((o) => (
                                            <option key={o.id} value={o.id}>
                                                {o.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-primary-400 group-hover:text-primary-600 transition-colors">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div className="h-0.5 w-full bg-primary-100 group-hover:bg-primary-500 transition-all rounded-full" />
                                </div>
                            ) : (
                                <h1 className="text-2xl font-black text-primary-950 tracking-tight">
                                    {outlets.find(o => o.id === selectedOutletId)?.name || 'Kasir POS'}
                                </h1>
                            )}

                            {/* Shift Status Button */}
                            <button
                                onClick={() => activeShift ? setShowCloseShiftModal(true) : setShowShiftModal(true)}
                                className={`ml-4 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all shadow-sm active:scale-95 ${activeShift
                                    ? 'bg-secondary-50 text-secondary-700 hover:bg-secondary-100 border border-secondary-200'
                                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
                                    }`}
                            >
                                <History className="h-4 w-4" />
                                {activeShift ? 'Tutup Shift' : 'Buka Shift'}
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${activeShift ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <p className="text-sm font-medium text-primary-500">
                                {activeShift
                                    ? `Kasir: ${employees.find(e => e.id === activeShift.employeeId)?.name || '...'} (${session?.user?.name || 'User'})`
                                    : session?.user?.name ? `Login: ${session.user.name}` : 'Shift Belum Dibuka'
                                }
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleFullscreen}
                        className="rounded-xl bg-secondary-100 p-3 text-secondary-600 transition-colors hover:bg-secondary-200"
                        title="Toggle Fullscreen"
                    >
                        <Maximize2 className="h-5 w-5" />
                    </button>
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 rounded-xl bg-primary-100 px-4 py-3 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-200"
                    >
                        <LogOut className="h-4 w-4" />
                        Keluar Mode POS
                    </Link>
                </div>
            </div>

            {/* POS Content */}
            <div className="flex flex-1 gap-4 overflow-hidden p-4">
                {/* Product Grid */}
                <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-lg shadow-primary-100/50">
                    {/* Search Bar */}
                    <div className="border-b border-primary-100 bg-gradient-to-r from-primary-50 to-secondary-50 p-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-400" />
                            <input
                                type="text"
                                placeholder="Cari produk atau scan barcode..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-primary-200 bg-white py-4 pl-12 pr-4 text-primary-900 placeholder:text-primary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Category Filter Bar */}
                    <div className="no-scrollbar flex items-center gap-3 overflow-x-auto border-b border-primary-100 bg-white px-4 py-4">
                        <button
                            onClick={() => setSelectedCategory("all")}
                            className={`flex h-10 flex-shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-6 text-sm font-bold transition-all active:scale-95 ${selectedCategory === "all"
                                ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-200/50"
                                : "bg-white border border-primary-100 text-primary-600 hover:border-primary-300 hover:bg-primary-50"
                                }`}
                        >
                            Semua
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex h-10 flex-shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-6 text-sm font-bold transition-all active:scale-95 ${selectedCategory === cat.id
                                    ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-200/50"
                                    : "bg-white border border-primary-100 text-primary-600 hover:border-primary-300 hover:bg-primary-50"
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Products */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {filteredProducts.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-primary-400">
                                <Package className="mb-3 h-16 w-16" />
                                <p className="text-lg">Tidak ada produk tersedia</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="group relative flex flex-col rounded-xl border border-primary-100 bg-white p-4 text-left shadow-sm transition-all hover:border-secondary-300 hover:shadow-lg hover:shadow-secondary-100/50 active:scale-95"
                                    >
                                        {/* Variant Badge */}
                                        {product.variants && product.variants.length > 0 && (
                                            <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-secondary-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                                <Maximize2 className="h-3 w-3" />
                                                {product.variants.length} varian
                                            </div>
                                        )}
                                        <div className="mb-3 flex h-24 w-full items-center justify-center overflow-hidden rounded-lg">
                                            <ProductImage
                                                src={product.imageUrl || (product as any).image_url}
                                                alt={product.name}
                                                className="h-full w-full transition-transform group-hover:scale-110"
                                                iconSize="h-10 w-10"
                                            />
                                        </div>
                                        <p className="mb-1 line-clamp-2 text-sm font-medium text-primary-900">
                                            {product.name}
                                        </p>
                                        <p className="text-xs text-primary-400">
                                            Stok: {product.stock}
                                        </p>
                                        <p className="mt-auto pt-2 text-base font-bold text-secondary-600">
                                            {formatPrice(parseFloat(product.price))}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Panel */}
                <div className="flex w-96 flex-col overflow-hidden rounded-2xl border border-secondary-100 bg-white shadow-lg shadow-secondary-100/50 xl:w-[420px]">
                    {/* Cart Header */}
                    <div className="flex items-center justify-between border-b border-primary-600 bg-gradient-to-r from-primary-600 to-primary-500 p-3">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-white" />
                            <h2 className="text-base font-bold text-white">Keranjang</h2>
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
                                {cart.reduce((sum, i) => sum + i.quantity, 0)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowHeldOrdersModal(true)}
                                className="flex items-center gap-1.5 rounded-lg border border-transparent bg-white/20 px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-white/30"
                            >
                                <Package className="h-3.5 w-3.5" />
                                Ditahan
                                {heldOrders.length > 0 && (
                                    <span className="rounded-full bg-white text-primary-600 px-1 py-0.5 text-[9px] font-bold">
                                        {heldOrders.length}
                                    </span>
                                )}
                            </button>
                            {cart.length > 0 && (
                                <button onClick={clearCart} className="text-xs text-white/70 hover:text-white px-1">
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Customer Selector */}
                    <div className="border-b border-secondary-100 bg-secondary-50 p-3">
                        <label className="mb-1 flex items-center gap-1 text-xs font-medium text-secondary-700">
                            <User className="h-3 w-3" />
                            Pelanggan (Opsional)
                        </label>
                        <select
                            value={selectedCustomer?.id || ""}
                            onChange={(e) => {
                                const customer = customers.find((c) => c.id === e.target.value);
                                setSelectedCustomer(customer || null);
                            }}
                            className="w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-900 focus:border-secondary-500 focus:outline-none focus:ring-1 focus:ring-secondary-500"
                        >
                            <option value="">-- Tanpa Pelanggan --</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name}{customer.phone ? ` (${customer.phone})` : ""}
                                    {customer.points > 0 ? ` • ${customer.points} poin` : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {cart.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-primary-400">
                                <ShoppingCart className="mb-3 h-16 w-16" />
                                <p className="text-lg">Keranjang kosong</p>
                                <p className="text-sm">Klik produk untuk menambahkan</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex items-center gap-2 rounded-lg border border-primary-100 bg-primary-50/50 p-2">
                                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-white">
                                            <ProductImage
                                                src={item.imageUrl || (item as any).image_url}
                                                alt={item.name}
                                                className="h-full w-full"
                                                iconSize="h-6 w-6"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-primary-900 text-sm truncate">
                                                {item.name}
                                                {item.variantName && (
                                                    <span className="font-normal text-xs text-primary-500 ml-1">({item.variantName})</span>
                                                )}
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs text-primary-500">
                                                    {formatPrice(parseFloat(item.price))} × {item.quantity}
                                                </p>
                                                <p className="text-sm font-bold text-secondary-600">
                                                    {formatPrice(parseFloat(item.price) * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 border-l border-primary-100 pl-2">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="rounded bg-primary-100 p-1 text-primary-600 hover:bg-primary-200">
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="text-sm font-bold text-primary-900 w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="rounded bg-primary-100 p-1 text-primary-600 hover:bg-primary-200">
                                                <Plus className="h-3 w-3" />
                                            </button>
                                            <button onClick={() => removeFromCart(item.id)} className="ml-1 rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-500">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cart Footer Container */}
                    <div className="flex flex-col border-t border-primary-100 bg-gradient-to-r from-primary-50 to-secondary-50 overflow-hidden max-h-[60%] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                        {/* Scrollable Content inside Footer */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {/* Totals */}
                            <div className="mb-3 space-y-1.5">
                                <div className="flex justify-between text-primary-600 text-xs">
                                    <span>Subtotal ({cart.reduce((sum, i) => sum + i.quantity, 0)} item)</span>
                                    <span className="text-primary-900 font-medium">{formatPrice(getSubtotal())}</span>
                                </div>
                                {getMemberDiscount() > 0 && (
                                    <div className="flex justify-between text-green-600 text-xs">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-2.5 w-2.5" />
                                            <span>Diskon Member</span>
                                        </div>
                                        <span className="font-medium">-{formatPrice(getMemberDiscount())}</span>
                                    </div>
                                )}
                                {getTax() > 0 && (
                                    <div className="flex justify-between text-primary-600 text-xs italic">
                                        <div className="flex flex-col">
                                            <span>{taxSettings?.name || "Pajak"} ({taxSettings?.rate}%)</span>
                                            {taxSettings?.is_inclusive && (
                                                <span className="text-[10px] text-primary-400 not-italic">(Sudah termasuk dalam harga)</span>
                                            )}
                                        </div>
                                        <span className="font-medium">{formatPrice(getTax())}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-primary-200 pt-2 text-xl font-black">
                                    <span className="text-primary-950">Total</span>
                                    <span className="text-primary-700">{formatPrice(getTotal())}</span>
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div className="mb-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-sm font-medium text-primary-500">Metode Pembayaran</p>
                                    <button
                                        onClick={() => {
                                            setIsSplitMode(!isSplitMode);
                                            if (!isSplitMode && appliedPayments.length === 0) {
                                                addPayment("cash");
                                            }
                                        }}
                                        className={`text-xs font-bold uppercase transition-colors ${isSplitMode ? 'text-secondary-600' : 'text-primary-400 hover:text-primary-600'}`}
                                    >
                                        {isSplitMode ? "Mode Split Aktif" : "Bayar Split?"}
                                    </button>
                                </div>

                                {availablePaymentMethods.length > 0 && availablePaymentMethods.every((m: any) => !m.outletId) && (
                                    <div className="mb-3 rounded-xl bg-yellow-50 p-3 border border-yellow-200 animate-in fade-in slide-in-from-top-1">
                                        <div className="flex gap-2">
                                            <div className="mt-0.5">
                                                <Smartphone className="h-4 w-4 text-yellow-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-yellow-800 uppercase tracking-tight">Metode Pembayaran Default</p>
                                                <p className="text-[9px] text-yellow-700 leading-tight">Outlet ini belum memiliki setelan pembayaran khusus. Silakan atur di menu <Link href="/dashboard/settings" className="font-bold underline">Pengaturan</Link> untuk mengaktifkan fitur transfer/QRIS manual.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-2">
                                    {(availablePaymentMethods.length > 0 ? availablePaymentMethods : [
                                        { id: "cash", type: "cash", name: "Cash" },
                                        { id: "qris", type: "qris", name: "QRIS" },
                                        { id: "transfer", type: "transfer", name: "Transfer" },
                                    ]).map((method) => {
                                        const TypeIcon = method.type === 'qris' ? QrCode :
                                            method.type === 'transfer' ? ArrowRightLeft :
                                                method.type === 'ewallet' ? Wallet :
                                                    method.type === 'card' ? CreditCard :
                                                        Banknote;
                                        const id = method.id;
                                        const label = method.name;
                                        return (
                                            <button
                                                key={id}
                                                onClick={() => addPayment(id)}
                                                className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${(isSplitMode ? appliedPayments.some(p => p.paymentMethod === id) : selectedPayment === id)
                                                    ? "border-secondary-500 bg-secondary-100 text-secondary-700 ring-2 ring-secondary-500/20"
                                                    : "border-primary-200 text-primary-600 hover:border-secondary-300 hover:bg-secondary-50"
                                                    }`}
                                            >
                                                <TypeIcon className="h-6 w-6" />
                                                <span className="text-sm font-medium">
                                                    {(method.type === 'transfer' && !method.isManual && (!method.bankAccounts || method?.bankAccounts?.length === 0) && (isSplitMode ? appliedPayments.some(p => p.paymentMethod === id) : selectedPayment === id))
                                                        ? `VA ${selectedBank.toUpperCase()}`
                                                        : label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Applied Payments List (Split Mode) */}
                                {appliedPayments.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-400">Rincian Pembayaran</p>
                                            <p className="text-[10px] font-medium text-primary-400">{appliedPayments.length} Metode</p>
                                        </div>
                                        <div className="space-y-2">
                                            {appliedPayments.map((p, idx) => (
                                                <div key={idx} className="group relative overflow-hidden rounded-2xl bg-white p-3 border border-primary-100 shadow-sm transition-all hover:border-secondary-300">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-secondary-400" />
                                                            <span className="text-xs font-bold uppercase tracking-tight text-primary-600">
                                                                {(() => {
                                                                    const m = (availablePaymentMethods.length > 0 ? availablePaymentMethods : [
                                                                        { id: "cash", type: "cash", name: "Cash" },
                                                                        { id: "qris", type: "qris", name: "QRIS" },
                                                                        { id: "transfer", type: "transfer", name: "Transfer" },
                                                                    ]).find(method => method.id === p.paymentMethod);
                                                                    return m?.name || p.paymentMethod;
                                                                })()}
                                                            </span>
                                                        </div>
                                                        {appliedPayments.length > 1 && (
                                                            <button
                                                                onClick={() => removePayment(idx)}
                                                                className="rounded-lg p-1 text-primary-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                                title="Hapus Pembayaran"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex-1">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary-400">Rp</span>
                                                            {isSplitMode ? (
                                                                <input
                                                                    type="text"
                                                                    value={p.amount.toLocaleString('id-ID')}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value.replace(/\D/g, "");
                                                                        const val = parseInt(raw) || 0;
                                                                        const news = [...appliedPayments];
                                                                        news[idx].amount = val;
                                                                        setAppliedPayments(news);
                                                                    }}
                                                                    className="w-full rounded-xl border border-primary-100 bg-primary-50/50 py-2 pl-9 pr-3 text-sm font-bold text-primary-900 focus:border-secondary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-secondary-500/10 transition-all"
                                                                />
                                                            ) : (
                                                                <div className="w-full rounded-xl border border-transparent bg-primary-50/50 py-2 pl-9 pr-3 text-sm font-bold text-primary-900">
                                                                    {p.amount.toLocaleString('id-ID')}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {p.type === 'transfer' && (p.bank || p.manualAccount) && (
                                                            <div className="mt-1 flex items-center gap-1.5 px-2 py-1 rounded bg-secondary-50 border border-secondary-100/50">
                                                                <ArrowRightLeft className="h-2.5 w-2.5 text-secondary-500" />
                                                                <span className="text-[10px] font-bold text-secondary-600 uppercase">
                                                                    {p.manualAccount ? p.manualAccount.bankName : p.bank}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {isSplitMode && (
                                            <div className={`mt-3 rounded-2xl p-4 text-center transition-all flex flex-col items-center gap-1 border border-dashed ${getRemainingBalance() === 0
                                                ? 'bg-green-50/50 border-green-200 text-green-700'
                                                : getRemainingBalance() > 0
                                                    ? 'bg-amber-50/50 border-amber-200 text-amber-700'
                                                    : 'bg-red-50/50 border-red-200 text-red-700'}`}>
                                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                                    {getRemainingBalance() === 0 ? 'Tagihan Terbayar' : getRemainingBalance() > 0 ? 'Sisa Tagihan' : 'Kelebihan Bayar'}
                                                </span>
                                                <span className="text-lg font-black font-mono">
                                                    Rp {Math.abs(getRemainingBalance()).toLocaleString('id-ID')}
                                                </span>
                                                {getRemainingBalance() > 0 && (
                                                    <span className="text-[10px] mt-1 italic opacity-60">Lengkapi pembayaran untuk konfirmasi</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Bank Selection for Transfer (Integrated & Manual) */}
                                {(() => {
                                    const m = (availablePaymentMethods.length > 0 ? availablePaymentMethods : [
                                        { id: "cash", type: "cash", name: "Cash" },
                                        { id: "qris", type: "qris", name: "QRIS" },
                                        { id: "transfer", type: "transfer", name: "Transfer" },
                                    ]).find(method => method.id === selectedPayment);

                                    if (m?.type !== 'transfer') return null;

                                    const manualAccounts = m.bankAccounts || (m.bankName ? [{ bankName: m.bankName, accountNumber: m.accountNumber, accountHolder: m.accountHolder }] : []);

                                    if (m.isManual || manualAccounts.length > 0) {
                                        // Manual Bank Selection
                                        return (
                                            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary-400">Pilih Rekening Transfer</p>
                                                <div className="flex flex-col gap-2">
                                                    {manualAccounts.map((acc: any, aidx: number) => (
                                                        <button
                                                            key={aidx}
                                                            onClick={() => setSelectedManualAccount(acc)}
                                                            className={`flex flex-col items-start rounded-xl border p-3 transition-all ${selectedManualAccount?.accountNumber === acc.accountNumber
                                                                ? "border-secondary-500 bg-secondary-100 text-secondary-700 ring-2 ring-secondary-500/20"
                                                                : "border-primary-100 bg-white text-primary-600 hover:border-secondary-300 hover:bg-secondary-50"
                                                                }`}
                                                        >
                                                            <div className="flex w-full items-center justify-between">
                                                                <span className="text-sm font-bold">{acc.bankName}</span>
                                                                {selectedManualAccount?.accountNumber === acc.accountNumber && <Check className="h-4 w-4" />}
                                                            </div>
                                                            <span className="text-xs font-medium opacity-70">{acc.accountNumber}</span>
                                                            {acc.accountHolder && <span className="mt-1 text-[10px] font-bold uppercase opacity-50">A.N. {acc.accountHolder}</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Integrated (VA) Bank Selection
                                    return (
                                        <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                            <p className="mb-2 text-xs font-medium text-primary-500">Pilih Bank (Virtual Account)</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {['bca', 'mandiri', 'bni', 'bri'].map((bank) => (
                                                    <button
                                                        key={bank}
                                                        onClick={() => setSelectedBank(bank)}
                                                        className={`rounded-lg border px-2 py-2 text-sm font-bold uppercase transition-all ${selectedBank === bank
                                                            ? 'border-secondary-500 bg-secondary-100 text-secondary-700'
                                                            : 'border-primary-200 text-primary-500 hover:border-secondary-300 hover:bg-secondary-50'
                                                            }`}
                                                    >
                                                        {bank}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Fixed Checkout Button Area */}
                        <div className="border-t border-primary-100 bg-white p-4">
                            <button
                                onClick={() => cart.length > 0 ? setShowHoldOrderModal(true) : showToast("Error", "Keranjang kosong!", "error")}
                                className="mb-3 w-full flex items-center justify-center gap-2 rounded-xl border-2 border-secondary-400 bg-white py-3 text-sm font-semibold text-secondary-600 transition-all hover:bg-secondary-50"
                            >
                                <Package className="h-4 w-4" />
                                Tahan Pesanan
                            </button>

                            <button
                                onClick={() => {
                                    if (appliedPayments.length === 0) {
                                        addPayment(selectedPayment);
                                    }
                                    setShowCheckoutModal(true);
                                }}
                                disabled={cart.length === 0 || isCheckingOut || (() => {
                                    const m = (availablePaymentMethods.length > 0 ? availablePaymentMethods : [
                                        { id: "cash", type: "cash", name: "Cash" },
                                        { id: "qris", type: "qris", name: "QRIS" },
                                        { id: "transfer", type: "transfer", name: "Transfer" },
                                    ]).find(method => method.id === selectedPayment);
                                    if (m?.type === 'transfer') {
                                        if (m.isManual || (m.bankAccounts && m.bankAccounts.length > 0)) return !selectedManualAccount;
                                        return !selectedBank;
                                    }
                                    return false;
                                })() || !activeShift || (isSplitMode && getRemainingBalance() !== 0)}
                                className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 py-4 text-lg font-bold text-white shadow-lg shadow-primary-500/30 transition-all hover:from-primary-600 hover:to-primary-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                            >
                                {isCheckingOut ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    `Bayar ${formatPrice(getTotal())}`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hold Order Confirmation Modal */}
            {
                showHoldOrderModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-950/40 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-primary-900/20 border border-white/20 animate-in zoom-in-95 duration-300">
                            <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600 p-8 text-center relative overflow-hidden">
                                {/* Decorative background circle */}
                                <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
                                <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-primary-950/10 blur-xl" />

                                <div className="relative z-10">
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-inner">
                                        <Package className="h-10 w-10 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white tracking-tight">Tahan Pesanan</h3>
                                    <p className="text-primary-100/80 font-medium">Simpan untuk dilanjutkan kapan saja</p>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="mb-6 space-y-4">
                                    <div className="flex items-center justify-between rounded-2xl bg-primary-50 px-5 py-4 border border-primary-100/50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary-400 mb-1">Ringkasan</span>
                                            <span className="text-sm font-bold text-primary-900">{cart.reduce((s, i) => s + i.quantity, 0)} Items</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-primary-400 mb-1">Total</span>
                                            <span className="text-xl font-black text-secondary-600">{formatPrice(getTotal())}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-primary-400 ml-1">Catatan Pesanan</label>
                                        <textarea
                                            value={holdOrderNotes}
                                            onChange={(e) => setHoldOrderNotes(e.target.value)}
                                            placeholder="Contoh: Meja 5, Nama pelanggan, dll..."
                                            rows={3}
                                            className="w-full rounded-2xl border border-primary-100 bg-primary-50/30 px-5 py-4 text-sm text-primary-900 placeholder:text-primary-300 focus:border-secondary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-secondary-500/10 transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowHoldOrderModal(false)}
                                        className="flex-1 rounded-2xl border border-primary-200 py-4 text-sm font-bold text-primary-600 transition-all hover:bg-primary-50 hover:border-primary-300"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleHoldOrder}
                                        disabled={isProcessingHold}
                                        className="flex-[1.5] flex items-center justify-center gap-2 rounded-2xl bg-secondary-500 py-4 text-sm font-black text-secondary-950 shadow-lg shadow-secondary-500/20 transition-all hover:bg-secondary-400 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isProcessingHold ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Check className="h-5 w-5" />
                                        )}
                                        {isProcessingHold ? "Menyimpan..." : "Konfirmasi Tahan"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Held Orders List Modal */}
            {
                showHeldOrdersModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-950/40 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-[40px] bg-white shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
                            <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-8 flex items-center justify-between relative overflow-hidden">
                                {/* Decorative background */}
                                <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 translate-x-32" />

                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                                            <Package className="h-6 w-6 text-secondary-400" />
                                        </div>
                                        Antrian Pesanan Ditahan
                                    </h3>
                                    <p className="mt-1 text-primary-100 font-medium text-sm">
                                        {heldOrders.length} pesanan menunggu untuk dilanjutkan
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowHeldOrdersModal(false)}
                                    className="relative z-10 h-12 w-12 flex items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-primary-50/30">
                                {heldOrders.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center py-20">
                                        <div className="h-32 w-32 rounded-[40px] bg-white shadow-xl flex items-center justify-center mb-6 border border-primary-100">
                                            <Package className="h-16 w-16 text-primary-100" />
                                        </div>
                                        <p className="text-xl font-bold text-primary-900 mb-2">Belum ada antrian</p>
                                        <p className="text-sm text-primary-400 max-w-[240px] text-center">Pesanan yang Anda tahan akan muncul di sini untuk dilanjutkan nanti.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {heldOrders.map((order) => (
                                            <div
                                                key={order.id}
                                                className="group overflow-hidden rounded-3xl border border-primary-100 bg-white p-6 shadow-sm transition-all hover:border-secondary-300 hover:shadow-xl hover:shadow-primary-900/5"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="h-2 w-2 rounded-full bg-secondary-500 animate-pulse" />
                                                            <span className="text-xs font-black text-primary-400 uppercase tracking-widest">
                                                                {new Date(order.createdAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-lg font-bold text-primary-900">
                                                            {order.notes || "Tanpa Catatan"}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-black text-secondary-600">{formatPrice(order.totalAmount)}</p>
                                                        <p className="text-[10px] font-bold text-primary-300 uppercase">{order.items.length} Items</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 mt-6">
                                                    <button
                                                        onClick={() => handleDeleteHeldOrder(order.id)}
                                                        className="p-3 rounded-2xl border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                                        title="Hapus permanen"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleResumeOrder(order)}
                                                        className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-secondary-500 py-3.5 text-sm font-black text-secondary-950 shadow-lg shadow-secondary-500/20 transition-all hover:bg-secondary-400 active:scale-[0.98]"
                                                    >
                                                        <ShoppingCart className="h-4 w-4" />
                                                        Lanjutkan Pesanan
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {heldOrders.length > 0 && (
                                <div className="p-6 bg-white border-t border-primary-100 flex justify-center">
                                    <p className="text-xs text-primary-300 font-medium">Klik "Lanjutkan Pesanan" untuk memasukkan kembali item ke keranjang aktif.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Checkout Modal */}
            {
                showCheckoutModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/30 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-primary-900">Konfirmasi Pembayaran</h3>
                                <button onClick={() => setShowCheckoutModal(false)} className="rounded-lg p-2 text-primary-400 hover:bg-primary-50 hover:text-primary-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mb-6 rounded-2xl border border-primary-100 bg-primary-50/30 p-5">
                                <div className="space-y-3 mb-4 border-b border-primary-100 pb-4 border-dashed">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-primary-600">Total Item</span>
                                        <span className="font-bold text-primary-900">{cart.reduce((sum, i) => sum + i.quantity, 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-primary-600">Metode Pembayaran</span>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold capitalize text-primary-900">
                                                    {(() => {
                                                        const m = (availablePaymentMethods.length > 0 ? availablePaymentMethods : [
                                                            { id: "cash", type: "cash", name: "Cash" },
                                                            { id: "qris", type: "qris", name: "QRIS" },
                                                            { id: "transfer", type: "transfer", name: "Transfer" },
                                                        ]).find(method => method.id === selectedPayment);
                                                        return m?.name || selectedPayment;
                                                    })()}
                                                </span>
                                                {(() => {
                                                    const m = (availablePaymentMethods.length > 0 ? availablePaymentMethods : [
                                                        { id: "cash", type: "cash", name: "Cash" },
                                                        { id: "qris", type: "qris", name: "QRIS" },
                                                        { id: "transfer", type: "transfer", name: "Transfer" },
                                                    ]).find(method => method.id === selectedPayment);
                                                    if (m?.type === 'qris') return <QrCode className="h-3.5 w-3.5 text-primary-500" />;
                                                    if (m?.type === 'cash') return <Banknote className="h-3.5 w-3.5 text-primary-500" />;
                                                    if (m?.type === 'transfer') return <ArrowRightLeft className="h-3.5 w-3.5 text-primary-500" />;
                                                    return <CreditCard className="h-3.5 w-3.5 text-primary-500" />;
                                                })()}
                                            </div>
                                            {(() => {
                                                const m = availablePaymentMethods.find(method => method.id === selectedPayment);

                                                if (m?.type === 'transfer') {
                                                    if (selectedManualAccount) {
                                                        return (
                                                            <div className="text-[10px] text-right text-primary-600 bg-primary-100/50 px-2 py-0.5 rounded leading-tight mt-1">
                                                                <div className="font-bold">{selectedManualAccount.bankName}</div>
                                                                <div>{selectedManualAccount.accountNumber}</div>
                                                                {selectedManualAccount.accountHolder && <div className="font-semibold uppercase truncate">{selectedManualAccount.accountHolder}</div>}
                                                            </div>
                                                        );
                                                    }
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                    {getTax() > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-primary-600">
                                                {taxSettings?.name || "Pajak"} ({taxSettings?.rate}%)
                                                {taxSettings?.is_inclusive && " (Inc)"}
                                            </span>
                                            <span className="font-bold text-primary-900">{formatPrice(getTax())}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold uppercase tracking-wider text-primary-500">Tagihan</span>
                                    <span className="text-3xl font-black text-primary-600">
                                        {formatPrice(appliedPayments.find(p => p.paymentMethod === selectedPayment)?.amount || getTotal())}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setShowCheckoutModal(false)} className="flex-1 rounded-xl border border-primary-200 py-3 font-medium text-primary-700 hover:bg-primary-50">
                                    Batal
                                </button>
                                <button
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut}
                                    className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 font-bold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                                >
                                    {isCheckingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                                    Konfirmasi Bayar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Success Modal */}
            {
                checkoutSuccess && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/30 backdrop-blur-sm">
                        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-200">
                                <Check className="h-12 w-12 text-green-600" />
                            </div>
                            <h3 className="mb-2 text-2xl font-bold text-primary-900">Transaksi Berhasil!</h3>
                            <p className="mb-4 text-center text-zinc-500">
                                Transaksi berhasil disimpan dengan nomor invoice: <br />
                                <span className="font-bold text-zinc-900">{lastInvoice}</span>
                            </p>
                            {lastTransaction?.payments && lastTransaction.payments.length > 1 && (
                                <div className="mb-6 rounded-xl bg-zinc-50 p-4 text-left space-y-2 border border-zinc-100">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Rincian Pembayaran</p>
                                    <div className="flex justify-between text-xs text-zinc-500 mb-1 border-b border-zinc-100 pb-1">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(lastTransaction?.subtotal || 0)}</span>
                                    </div>
                                    {(lastTransaction?.discount > 0) && (
                                        <div className="flex justify-between text-xs text-green-600 mb-1">
                                            <span>Diskon</span>
                                            <span>-{formatPrice(lastTransaction.discount)}</span>
                                        </div>
                                    )}
                                    {(lastTransaction?.tax > 0) && (
                                        <div className="flex justify-between text-xs text-zinc-500 mb-1">
                                            <span className="flex items-center gap-1">
                                                {lastTransaction?.taxName || "Pajak"}
                                                {lastTransaction?.is_inclusive && " (Inc)"}
                                            </span>
                                            <span>{formatPrice(lastTransaction.tax)}</span>
                                        </div>
                                    )}
                                    {lastTransaction.payments.map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-zinc-600">
                                                {formatPaymentMethodName(p.paymentMethod)}
                                            </span>
                                            <span className="font-bold text-zinc-900">{formatPrice(p.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex w-full flex-col gap-3">
                                <button
                                    onClick={handlePrint}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-700"
                                >
                                    <Printer className="h-5 w-5" />
                                    Cetak Struk
                                </button>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/receipt/${lastInvoice}`;
                                        navigator.clipboard.writeText(url);
                                        setCopiedLink(true);
                                        setTimeout(() => setCopiedLink(false), 2000);
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-3 font-medium text-primary-700 transition-colors hover:bg-primary-50"
                                >
                                    {copiedLink ? <Check className="h-5 w-5 text-green-500" /> : <LinkIcon className="h-5 w-5" />}
                                    {copiedLink ? "Link Disalin" : "Salin Link Struk"}
                                </button>
                                <a
                                    href={`https://wa.me/?text=Halo, berikut struk belanja Anda di ${outlets.find(o => o.id === selectedOutletId)?.name || 'SediaPOS'}: ${window.location.origin}/receipt/${lastInvoice}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-[#25D366] px-4 py-3 font-medium text-white transition-colors hover:opacity-90"
                                >
                                    <Share2 className="h-5 w-5" />
                                    Kirim WhatsApp
                                </a>
                                <button
                                    onClick={() => setCheckoutSuccess(false)}
                                    className="mt-2 w-full text-sm text-zinc-500 hover:text-zinc-900"
                                >
                                    Tutup & Transaksi Baru
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <ManagerAuthModal
                isOpen={showManagerAuth}
                onClose={() => {
                    setShowManagerAuth(false);
                    setPendingDeleteId(null);
                    setPendingAction(null);
                }}
                onSuccess={handleManagerAuthSuccess}
                outletId={selectedOutletId}
                actionDescription={pendingAction === "clear_cart" ? "Mengosongkan/Reset seluruh keranjang" : "Hapus item dari keranjang"}
            />

            {/* QRIS/Transfer Modal */}
            {
                showQrisModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-[380px] rounded-[24px] bg-white p-6 shadow-2xl text-center transform transition-all animate-in zoom-in-95 duration-200">
                            {/* Header */}
                            <h3 className={`text-xl font-bold mb-2 ${selectedManualAccount ? 'text-primary-800' : 'text-zinc-900'}`}>
                                {vaNumber ? `Virtual Account ${selectedBank?.toUpperCase()}` : (selectedManualAccount ? `Transfer ${selectedManualAccount.bankName}` : 'Scan QRIS')}
                            </h3>
                            <p className="text-zinc-500 mb-6 text-sm">
                                {(vaNumber || selectedManualAccount) ? 'Lakukan transfer ke nomor berikut' : 'Scan QR Code untuk membayar'}
                            </p>

                            {/* Card Container */}
                            <div className="mx-auto mb-6 bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm w-full relative overflow-hidden">
                                {vaNumber || selectedManualAccount ? (
                                    <div className="py-1">
                                        {billerCode ? (
                                            // Mandiri Layout
                                            <div className="flex flex-col gap-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center mb-2">Biller Code</p>
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(billerCode); showToast("Biller Code disalin", "success"); }}
                                                        className="flex items-center justify-center gap-2 group w-full hover:bg-zinc-50 rounded-lg p-1 transition-colors"
                                                    >
                                                        <span className="text-xl font-bold tracking-wider text-primary-900 font-mono">{billerCode}</span>
                                                        <Share2 className="h-4 w-4 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                </div>
                                                <div className="h-[1px] bg-zinc-100 w-full" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center mb-2">Bill Key</p>
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(vaNumber); showToast("Bill Key disalin", "success"); }}
                                                        className="flex items-center justify-center gap-2 group w-full hover:bg-zinc-50 rounded-lg p-1 transition-colors"
                                                    >
                                                        <span className="text-xl font-bold tracking-wider text-primary-900 font-mono">{vaNumber}</span>
                                                        <Share2 className="h-4 w-4 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            // Standard Bank Layout
                                            <div className="flex flex-col items-center gap-2">
                                                <p className="text-xs text-zinc-400 mb-1">
                                                    {vaNumber ? `Nomor VA ${selectedBank?.toUpperCase()}` : `Rekening ${selectedManualAccount?.bankName}`}
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(vaNumber || selectedManualAccount?.accountNumber || "");
                                                        showToast("Nomor disalin ke clipboard", "success");
                                                    }}
                                                    className="flex items-center justify-center gap-3 group w-full transition-all"
                                                    title="Salin Nomor"
                                                >
                                                    <span className="text-2xl font-bold tracking-wider text-zinc-900 font-mono">
                                                        {vaNumber || selectedManualAccount?.accountNumber}
                                                    </span>
                                                    <Share2 className="h-5 w-5 text-primary-600" />
                                                </button>
                                                {selectedManualAccount && (
                                                    <p className="text-[10px] text-zinc-400 mt-1">
                                                        Konfirmasi pembayaran manual setelah transfer
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {!selectedManualAccount && !billerCode && (
                                            <div className="mt-4 pt-4 border-t border-zinc-100">
                                                <p className="text-[10px] text-zinc-400">Status otomatis terupdate</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // QRIS Layout
                                    (qrisString || (() => {
                                        const m = availablePaymentMethods.find(method => method.id === selectedPayment);
                                        return m?.qrisData;
                                    })()) ? (
                                        <div className="bg-white p-2 rounded-xl inline-block">
                                            <QRCodeSVG
                                                value={qrisString || (() => {
                                                    const m = availablePaymentMethods.find(method => method.id === selectedPayment);
                                                    return m?.qrisData || "";
                                                })()}
                                                size={200}
                                            />
                                        </div>
                                    ) : (
                                        <div className="py-8 flex flex-col items-center gap-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                                            <p className="text-xs text-zinc-400">Menyiapkan pembayaran...</p>
                                        </div>
                                    )
                                )}
                            </div>

                            <p className="text-3xl font-bold text-primary-800 mb-6">
                                {formatPrice(appliedPayments.find(p => p.paymentMethod === selectedPayment)?.amount || getTotal())}
                            </p>

                            <div className="flex flex-col gap-3">
                                { /* Auto-pending State for Integrated Payments */}
                                {(!selectedManualAccount && (vaNumber || qrisString)) && (
                                    <div className="flex items-center justify-center gap-2 mb-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                                        <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                                        <span className="text-sm font-medium text-amber-700">Menunggu Pembayaran...</span>
                                    </div>
                                )}

                                { /* Manual Confirmation Button */}
                                {(selectedManualAccount || availablePaymentMethods.find(m => m.id === selectedPayment)?.isManual) && (
                                    <button
                                        onClick={() => completeCheckout(lastInvoice || "", "paid")}
                                        className="w-full rounded-full bg-primary-700 py-3.5 font-bold text-white shadow-lg shadow-primary-200 hover:bg-primary-800 hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                        title="Konfirmasi Pembayaran Manual"
                                    >
                                        <Check className="h-5 w-5" />
                                        Selesaikan Pembayaran
                                    </button>
                                )}

                                <button
                                    onClick={() => setShowQrisModal(false)}
                                    className={`w-full rounded-full py-3 font-bold transition-all ${selectedManualAccount ? 'text-zinc-600 hover:bg-zinc-50' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
                                >
                                    {selectedManualAccount ? 'Batal' : 'Batalkan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Buka Shift Modal */}
            {
                showShiftModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="bg-primary-600 p-6 text-white">
                                <h3 className="text-xl font-bold">Buka Shift Kasir</h3>
                                <p className="mt-1 text-sm text-primary-100 opacity-90">Input modal awal laci kasir</p>
                            </div>
                            <div className="p-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-primary-900">Pilih Karyawan</label>
                                        <select
                                            value={selectedEmployeeId}
                                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                            className="w-full rounded-xl border border-primary-200 bg-white p-4 text-primary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        >
                                            <option value="">-- Pilih Karyawan --</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-primary-900">Modal Awal (Cash)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary-400">Rp</span>
                                            <input
                                                type="number"
                                                value={startingCash}
                                                onChange={(e) => setStartingCash(e.target.value)}
                                                className="w-full rounded-xl border border-primary-200 bg-white py-4 pl-12 pr-4 text-2xl font-bold text-primary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                                placeholder="0"
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-primary-400">Sesuai dengan uang fisik yang ada di laci saat ini.</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleOpenShift}
                                    disabled={isProcessingShift || !selectedEmployeeId}
                                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 py-4 text-lg font-bold text-white transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                                >
                                    {isProcessingShift ? <Loader2 className="animate-spin" /> : <Check />}
                                    Buka Shift Sekarang
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Tutup Shift Modal */}
            {
                showCloseShiftModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between bg-secondary-600 p-6 text-secondary-50">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Tutup Shift & Rekonsiliasi</h3>
                                    <p className="mt-1 text-sm text-secondary-100">Hitung uang fisik di laci kasir</p>
                                </div>
                                <button onClick={() => setShowCloseShiftModal(false)} className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-primary-900">Total Uang Fisik (Cash)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary-400">Rp</span>
                                            <input
                                                type="number"
                                                value={endingCash}
                                                onChange={(e) => setEndingCash(e.target.value)}
                                                className="w-full rounded-xl border border-primary-200 bg-white py-4 pl-12 pr-4 text-2xl font-bold text-primary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                                placeholder="0"
                                                autoFocus
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-primary-400">Masukkan total uang tunai yang ada di laci kasir.</p>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-primary-900">Catatan (Opsional)</label>
                                        <textarea
                                            value={shiftNotes}
                                            onChange={(e) => setShiftNotes(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-xl border border-primary-200 bg-white p-4 text-primary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                            placeholder="Penyebab selisih, dll..."
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCloseShift}
                                    disabled={isProcessingShift}
                                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary-600 py-4 text-lg font-bold text-white transition-all hover:bg-secondary-700 active:scale-95 disabled:opacity-50 shadow-lg shadow-secondary-600/20"
                                >
                                    {isProcessingShift ? <Loader2 className="animate-spin" /> : <Calculator className="h-5 w-5" />}
                                    Konfirmasi & Tutup Shift
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Reconciliation Report Modal */}
            {
                shiftReconciliation && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="bg-primary-700 p-8 text-white">
                                <h3 className="text-2xl font-bold">Laporan Rekonsiliasi Shift</h3>
                                <p className="mt-1 text-primary-100 opacity-90">ID: {shiftReconciliation.invoiceNumber || shiftReconciliation.id}</p>
                            </div>
                            <div className="p-8">
                                <div className="space-y-4 rounded-2xl bg-primary-50 p-6">
                                    <div className="flex justify-between border-b border-primary-100 pb-3">
                                        <span className="text-primary-600">Modal Awal</span>
                                        <span className="font-bold text-primary-900">{formatPrice(parseFloat(shiftReconciliation.summary.startCash))}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-primary-100 pb-3">
                                        <span className="text-primary-600">Total Penjualan Tunai</span>
                                        <span className="font-bold text-primary-900">{formatPrice(parseFloat(shiftReconciliation.summary.cashSales))}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-primary-100 pt-1 pb-3">
                                        <span className="font-bold text-primary-700">Total Ekspektasi Kas</span>
                                        <span className="text-lg font-bold text-primary-950">{formatPrice(parseFloat(shiftReconciliation.summary.expectedCash))}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-primary-100 pt-1 pb-3">
                                        <span className="font-bold text-primary-700">Total Uang Fisik</span>
                                        <span className="text-lg font-bold text-primary-950">{formatPrice(parseFloat(shiftReconciliation.summary.actualEndingCash))}</span>
                                    </div>
                                    <div className={`flex justify-between rounded-xl p-4 ${parseFloat(shiftReconciliation.summary.difference) === 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                        <span className={`font-bold ${parseFloat(shiftReconciliation.summary.difference) === 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            Selisih
                                        </span>
                                        <span className={`text-xl font-black ${parseFloat(shiftReconciliation.summary.difference) === 0 ? 'text-green-800' : 'text-red-800'}`}>
                                            {formatPrice(parseFloat(shiftReconciliation.summary.difference))}
                                        </span>
                                    </div>
                                </div>

                                {shiftReconciliation.notes && (
                                    <div className="mt-6">
                                        <label className="mb-2 block text-sm font-bold text-primary-900 uppercase tracking-wider">Catatan</label>
                                        <div className="rounded-xl border border-primary-100 bg-white p-4 italic text-primary-600 text-sm">
                                            "{shiftReconciliation.notes}"
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShiftReconciliation(null);
                                            setShowShiftModal(true);
                                        }}
                                        className="flex-1 rounded-2xl bg-primary-600 py-4 font-bold text-white transition-all hover:bg-primary-700 active:scale-95"
                                    >
                                        Selesai & Buka Shift Baru
                                    </button>
                                    <button
                                        onClick={() => window.location.href = '/dashboard/reports'}
                                        className="flex-1 rounded-2xl border border-primary-200 bg-white py-4 font-bold text-primary-600 transition-all hover:bg-primary-50 active:scale-95"
                                    >
                                        Lihat Semua Laporan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Variant Selection Modal */}
            {showVariantModal && selectedProductForVariant && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-primary-100 p-6">
                            <div>
                                <h3 className="text-xl font-bold text-primary-900">Pilih Varian</h3>
                                <p className="text-sm text-primary-500">{selectedProductForVariant.name}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowVariantModal(false);
                                    setSelectedProductForVariant(null);
                                }}
                                className="rounded-xl p-2 text-primary-400 hover:bg-primary-50 hover:text-primary-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-6">
                            <div className="grid grid-cols-1 gap-3">
                                {selectedProductForVariant.variants?.filter(v => v.isActive).map((variant) => {
                                    const variantAdjustment = parseFloat(variant.priceAdjustment || "0");
                                    const finalPrice = parseFloat(selectedProductForVariant.price) + variantAdjustment;
                                    return (
                                        <button
                                            key={variant.id}
                                            onClick={() => addToCart(selectedProductForVariant, variant)}
                                            disabled={(variant.stock ?? 0) <= 0}
                                            className="group flex items-center justify-between rounded-2xl border border-primary-100 bg-white p-4 text-left transition-all hover:border-primary-500 hover:bg-primary-50 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                                    <Maximize2 className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-primary-900">{variant.name}</p>
                                                    <p className="text-xs text-primary-500">Stok: {variant.stock ?? 0}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary-600">{formatPrice(finalPrice)}</p>
                                                {variantAdjustment !== 0 && (
                                                    <p className="text-xs text-primary-400">
                                                        {variantAdjustment > 0 ? '+' : ''}{formatPrice(variantAdjustment)}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}


