"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface CartVariant {
    id: string;
    name: string;
    priceAdjustment: string | null;
}

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string | null;
    variant?: CartVariant | null;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
    removeItem: (productId: string, variantId?: string | null) => void;
    updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
    customerName: string;
    setCustomerName: (name: string) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
}

function getCartKey(outletSlug: string) {
    return `sedia-cart-${outletSlug}`;
}

interface CartProviderProps {
    children: ReactNode;
    outletSlug: string;
}

export function CartProvider({ children, outletSlug }: CartProviderProps) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState("");
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(getCartKey(outletSlug));
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) setItems(parsed);
            }

            const storedName = localStorage.getItem("sedia-customer-name");
            if (storedName) setCustomerName(storedName);
        } catch { }
        setIsLoaded(true);
    }, [outletSlug]);

    // Save to localStorage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(getCartKey(outletSlug), JSON.stringify(items));
        }
    }, [items, outletSlug, isLoaded]); useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("sedia-customer-name", customerName);
        }
    }, [customerName, isLoaded]);

    const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
        const qty = item.quantity || 1;
        setItems(prev => {
            const variantId = item.variant?.id || null;
            const existingIndex = prev.findIndex(
                i => i.productId === item.productId && (i.variant?.id || null) === variantId
            );

            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: updated[existingIndex].quantity + qty,
                };
                return updated;
            }

            return [...prev, { ...item, quantity: qty }];
        });

        // Open cart drawer briefly to show feedback
        setIsCartOpen(true);
    }, []);

    const removeItem = useCallback((productId: string, variantId?: string | null) => {
        setItems(prev =>
            prev.filter(i => !(i.productId === productId && (i.variant?.id || null) === (variantId || null)))
        );
    }, []);

    const updateQuantity = useCallback((productId: string, variantId: string | null, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId, variantId);
            return;
        }
        setItems(prev =>
            prev.map(i =>
                i.productId === productId && (i.variant?.id || null) === variantId
                    ? { ...i, quantity }
                    : i
            )
        );
    }, [removeItem]);

    const clearCart = useCallback(() => {
        setItems([]);
        setIsCartOpen(false);
    }, []);

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

    const totalPrice = items.reduce((sum, i) => {
        const adj = i.variant ? Number(i.variant.priceAdjustment || 0) : 0;
        return sum + (i.price + adj) * i.quantity;
    }, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                totalItems,
                totalPrice,
                isCartOpen,
                setIsCartOpen,
                customerName,
                setCustomerName,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}
