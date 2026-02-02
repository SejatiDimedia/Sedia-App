import { create } from 'zustand';
import { LocalCustomer } from '../db/client';
import { API_URL } from '../config/api';
import { useAuthStore } from './authStore';
import { useOutletStore } from './outletStore';

const API_BASE_URL = API_URL;

export interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    maxQuantity?: number;
}

export interface HeldOrder {
    id: string;
    outletId: string;
    items: CartItem[];
    customerId: string | null;
    customerName: string | null;
    customerPhone: string | null;
    notes: string | null;
    totalAmount: number;
    createdAt: string;
}

interface CartState {
    items: CartItem[];
    customer: LocalCustomer | null;
    heldOrders: HeldOrder[];
    resumedOrderId: string | null;
    isFetchingHeldOrders: boolean;
    addItem: (product: { id: string; name: string; price: number; stock?: number }) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    setCustomer: (customer: LocalCustomer | null) => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemCount: () => number;
    holdOrder: (outletId: string, notes?: string) => Promise<boolean>;
    resumeOrder: (heldOrder: HeldOrder) => Promise<void>;
    clearResumedOrder: () => void;
    fetchHeldOrders: (outletId: string) => Promise<void>;
    deleteHeldOrder: (orderId: string) => Promise<boolean>;
    markHeldOrderCompleted: (orderId: string) => Promise<boolean>;
    getSubtotal: () => number;
    getTax: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    customer: null,
    heldOrders: [],
    resumedOrderId: null,
    isFetchingHeldOrders: false,

    setCustomer: (customer) => set({ customer }),

    addItem: (product) => {
        set((state) => {
            const existingItem = state.items.find((item) => item.productId === product.id);
            const currentStock = product.stock || 0;

            if (existingItem) {
                if (existingItem.quantity >= currentStock) return state;
                return {
                    items: state.items.map((item) =>
                        item.productId === product.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    ),
                };
            }
            if (currentStock <= 0) return state;
            return {
                items: [
                    ...state.items,
                    {
                        id: `cart-${Date.now()}`,
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        maxQuantity: currentStock,
                    },
                ],
            };
        });
    },

    removeItem: (productId) => {
        set((state) => ({
            items: state.items.filter((item) => item.productId !== productId),
        }));
    },

    updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
            get().removeItem(productId);
            return;
        }
        set((state) => ({
            items: state.items.map((item) => {
                if (item.productId === productId) {
                    if (item.maxQuantity !== undefined && quantity > item.maxQuantity) return item;
                    return { ...item, quantity };
                }
                return item;
            }),
        }));
    },

    clearCart: () => set({ items: [], customer: null, resumedOrderId: null }),

    getSubtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

    getTax: () => {
        const { taxSettings } = useOutletStore.getState();
        if (!taxSettings || !taxSettings.isEnabled || taxSettings.rate <= 0) return 0;

        const subtotal = get().getSubtotal();

        if (taxSettings.isInclusive) {
            // Inclusive: Tax = Price - (Price / (1 + rate/100))
            return subtotal - (subtotal / (1 + taxSettings.rate / 100));
        } else {
            // Exclusive: Tax = Subtotal * (rate/100)
            return subtotal * (taxSettings.rate / 100);
        }
    },

    getTotal: () => {
        const subtotal = get().getSubtotal();
        const tax = get().getTax();
        const { taxSettings } = useOutletStore.getState();

        if (taxSettings?.isInclusive) {
            return subtotal;
        } else {
            return subtotal + tax;
        }
    },

    getItemCount: () => get().items.reduce((count, item) => count + item.quantity, 0),

    holdOrder: async (outletId, notes) => {
        const state = get();
        if (state.items.length === 0) return false;

        const url = `${API_BASE_URL}/held-orders`;
        const token = useAuthStore.getState().token;
        console.log(`[cartStore] holdOrder attempt. Outlet: ${outletId}, Token: ${token ? 'Present' : 'Missing'}`);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                credentials: 'include',
                body: JSON.stringify({
                    outletId,
                    customerId: state.customer?.id || null,
                    customerName: state.customer?.name || null,
                    customerPhone: state.customer?.phone || null,
                    items: state.items.map(item => ({
                        ...item,
                        id: item.productId,
                        productName: item.name
                    })),
                    notes,
                    totalAmount: state.getTotal(),
                }),
            });

            if (response.ok) {
                console.log('[cartStore] holdOrder success');
                state.clearCart();
                get().fetchHeldOrders(outletId);
                return true;
            } else {
                const errorText = await response.text();
                console.error(`[cartStore] holdOrder failed (${response.status}):`, errorText);
                return false;
            }
        } catch (error) {
            console.error('[cartStore] holdOrder exception:', error);
            return false;
        }
    },

    resumeOrder: async (heldOrder) => {
        console.log('[cartStore] resumeOrder starting for:', heldOrder.id);
        const itemsToRestore: CartItem[] = heldOrder.items.map((item: any) => ({
            id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: item.productId || item.id,
            name: item.name || item.productName || "Produk",
            price: typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0),
            quantity: item.quantity || 1,
            maxQuantity: item.maxQuantity || item.stock || 999
        }));

        let restoredCustomer: LocalCustomer | null = null;
        if (heldOrder.customerId) {
            restoredCustomer = {
                id: heldOrder.customerId,
                outletId: heldOrder.outletId,
                name: heldOrder.customerName || "Pelanggan",
                phone: heldOrder.customerPhone || null,
                email: null,
                points: 0,
                tier_id: null
            };
        }

        set({
            items: itemsToRestore,
            customer: restoredCustomer,
            resumedOrderId: heldOrder.id, // Track that we are working on a resumed order
            heldOrders: get().heldOrders.filter((h) => h.id !== heldOrder.id),
        });
        // Logic to delete from backend has been REMOVED per user request.
        // It should only be deleted when the order is completed (checked out) or manually deleted.
    },

    clearResumedOrder: () => set({ resumedOrderId: null }),

    fetchHeldOrders: async (outletId) => {
        if (!outletId) return;
        set({ isFetchingHeldOrders: true });
        const token = useAuthStore.getState().token;
        const url = `${API_BASE_URL}/held-orders?outletId=${outletId}`;
        console.log(`[cartStore] fetchHeldOrders attempt. Outlet: ${outletId}, Token: ${token ? 'Present' : 'Missing'}`);

        try {
            const response = await fetch(url, {
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`[cartStore] fetchHeldOrders success, found ${data.length} orders`);
                set({
                    heldOrders: data.map((order: any) => {
                        const rawItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                        const items = rawItems.map((item: any) => ({
                            id: item.id?.startsWith('cart-') ? item.id : `cart-init-${Math.random().toString(36).substring(2, 6)}`,
                            productId: item.productId || item.id,
                            name: item.name || item.productName || "Produk",
                            price: typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0),
                            quantity: item.quantity || 1,
                            maxQuantity: item.maxQuantity || item.stock || 999
                        }));

                        return {
                            id: order.id,
                            outletId: order.outletId,
                            customerId: order.customerId,
                            customerName: order.customerName,
                            customerPhone: order.customerPhone,
                            notes: order.notes,
                            totalAmount: typeof order.totalAmount === 'string' ? parseFloat(order.totalAmount) : order.totalAmount,
                            items: items,
                            createdAt: order.createdAt
                        };
                    }),
                });
            } else {
                const errorText = await response.text();
                console.error(`[cartStore] fetchHeldOrders failed (${response.status}):`, errorText);
            }
        } catch (error) {
            console.error('[cartStore] fetchHeldOrders exception:', error);
        } finally {
            set({ isFetchingHeldOrders: false });
        }
    },

    deleteHeldOrder: async (orderId) => {
        try {
            const token = useAuthStore.getState().token;
            const response = await fetch(`${API_BASE_URL}/held-orders/${orderId}`, {
                method: 'DELETE',
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                credentials: 'include'
            });
            if (response.ok) {
                set((state) => ({ heldOrders: state.heldOrders.filter((h) => h.id !== orderId) }));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to delete held order:', error);
            return false;
        }
    },

    markHeldOrderCompleted: async (orderId) => {
        try {
            const token = useAuthStore.getState().token;
            const response = await fetch(`${API_BASE_URL}/held-orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                credentials: 'include',
                body: JSON.stringify({ status: 'completed' }),
            });
            if (response.ok) {
                set((state) => ({ heldOrders: state.heldOrders.filter((h) => h.id !== orderId) }));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to mark held order completed:', error);
            return false;
        }
    },
}));
