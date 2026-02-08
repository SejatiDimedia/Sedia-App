import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { useAuthStore } from './authStore';

export interface Outlet {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    ownerId: string;
    primaryColor?: string | null;
    secondaryColor?: string | null;
}

export interface TaxSettings {
    isEnabled: boolean;
    name: string;
    rate: number;
    isInclusive: boolean;
}

interface OutletState {
    outlets: Outlet[];
    currentOutlet: Outlet | null;
    taxSettings: TaxSettings | null; // Added tax settings
    paymentMethods: any[]; // Added payment methods
    isFetchingPayments: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setOutlets: (outlets: Outlet[]) => void;
    setCurrentOutlet: (outlet: Outlet | null) => void;
    fetchOutlets: (token?: string) => Promise<void>;
    fetchTaxSettings: (outletId: string) => Promise<void>; // Added action
    fetchPaymentMethods: (outletId: string) => Promise<void>; // Added action
    createOutlet: (data: { name: string; address?: string; phone?: string }) => Promise<Outlet>;
    updateOutlet: (id: string, data: { name?: string; address?: string | null; phone?: string | null; primaryColor?: string | null; secondaryColor?: string | null }) => Promise<Outlet>;
    deleteOutlet: (id: string) => Promise<void>;
    switchOutlet: (id: string) => Promise<void>;
    clearOutlets: () => void;
}

const API_BASE_URL = API_URL;

export const useOutletStore = create<OutletState>()(persist((set, get) => ({
    outlets: [],
    currentOutlet: null,
    taxSettings: null,
    paymentMethods: [],
    isFetchingPayments: false,
    isLoading: false,
    error: null,

    setOutlets: (outlets) => set({ outlets }),
    setCurrentOutlet: (outlet) => set({ currentOutlet: outlet }),

    fetchOutlets: async (token?: string) => {
        set({ isLoading: true, error: null });
        const authToken = token || useAuthStore.getState().token;
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
            };

            const response = await fetch(`${API_BASE_URL}/outlets`, {
                headers,
                credentials: 'include' // Include cookies for session auth
            });

            if (!response.ok) {
                throw new Error('Failed to fetch outlets');
            }

            const outlets = await response.json();

            // If no outlets, set a default one for testing
            if (outlets.length === 0) {
                set({
                    outlets: [
                        {
                            id: 'default-outlet',
                            name: 'Outlet Utama',
                            address: 'Jl. Contoh No. 1',
                            ownerId: 'system',
                        },
                    ],
                    isLoading: false,
                });
                return;
            }

            set((state) => ({
                outlets,
                isLoading: false,
                // Sync currentOutlet with fresh data from list
                // If currentOutlet exists, update it. If not found in new list, fallback to first available.
                // If currentOutlet is null, auto-select the first available outlet.
                currentOutlet: state.currentOutlet
                    ? outlets.find((o: Outlet) => o.id === state.currentOutlet!.id) || outlets[0]
                    : outlets[0]
            }));
        } catch (error: any) {
            console.error('[OutletStore] Error fetching outlets:', error);
            // Fallback to default outlet
            set({
                outlets: [
                    {
                        id: 'default-outlet',
                        name: 'Outlet Utama',
                        address: 'Jl. Contoh No. 1',
                        ownerId: 'system',
                    },
                ],
                error: error.message,
                isLoading: false,
            });
        }
    },

    fetchTaxSettings: async (outletId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/tax-settings?outletId=${outletId}`);
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    set({
                        taxSettings: {
                            isEnabled: data.is_enabled ?? data.isEnabled ?? false,
                            name: data.name || "Pajak",
                            rate: parseFloat(data.rate) || 0,
                            isInclusive: data.is_inclusive ?? data.isInclusive ?? false,
                        }
                    });
                } else {
                    set({ taxSettings: null });
                }
            } else {
                set({ taxSettings: null });
            }
        } catch (error) {
            console.error('[OutletStore] Failed to fetch tax settings:', error);
            set({ taxSettings: null });
        }
    },

    fetchPaymentMethods: async (outletId: string) => {
        set({ isFetchingPayments: true });
        try {
            const response = await fetch(`${API_BASE_URL}/outlets/${outletId}/payment-methods`);
            if (response.ok) {
                const methods = await response.json();
                const normalized = (methods || []).map((m: any) => ({
                    ...m,
                    isManual: m.isManual ?? m.is_manual ?? false,
                    bankAccounts: m.bankAccounts ?? m.bank_accounts ?? (
                        (m.bankName || m.bank_name) ? [{
                            bankName: m.bankName || m.bank_name,
                            accountNumber: m.accountNumber || m.account_number,
                            accountHolder: m.accountHolder || m.account_holder
                        }] : []
                    )
                }));
                set({ paymentMethods: normalized, isFetchingPayments: false });
            } else {
                set({ paymentMethods: [], isFetchingPayments: false });
            }
        } catch (error) {
            console.error('[OutletStore] Failed to fetch payment methods:', error);
            set({ paymentMethods: [], isFetchingPayments: false });
        }
    },

    createOutlet: async (data: { name: string; address?: string; phone?: string }) => {
        set({ isLoading: true, error: null });
        const token = useAuthStore.getState().token;
        try {
            const response = await fetch(`${API_BASE_URL}/outlets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_BASE_URL.replace('/api', ''),
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal membuat outlet');
            }

            const newOutlet = await response.json();
            const { outlets } = get();
            set({ outlets: [...outlets, newOutlet], isLoading: false });
            return newOutlet;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateOutlet: async (id: string, data: { name?: string; address?: string | null; phone?: string | null; primaryColor?: string | null; secondaryColor?: string | null }) => {
        set({ isLoading: true, error: null });
        const token = useAuthStore.getState().token;
        try {
            const response = await fetch(`${API_BASE_URL}/outlets/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_BASE_URL.replace('/api', ''),
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal memperbarui outlet');
            }

            const updatedOutlet = await response.json();
            const { outlets, currentOutlet } = get();

            // Update in the list
            const newOutlets = outlets.map(o => o.id === id ? updatedOutlet : o);

            // Update currentOutlet if it's the one we modified
            const newCurrentOutlet = currentOutlet?.id === id ? updatedOutlet : currentOutlet;

            set({ outlets: newOutlets, currentOutlet: newCurrentOutlet, isLoading: false });
            return updatedOutlet;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    deleteOutlet: async (id: string) => {
        set({ isLoading: true, error: null });
        const token = useAuthStore.getState().token;
        try {
            const response = await fetch(`${API_BASE_URL}/outlets/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Origin': API_BASE_URL.replace('/api', ''),
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal menghapus outlet');
            }

            const { outlets, currentOutlet } = get();
            const newOutlets = outlets.filter(o => o.id !== id);

            // If we deleted the current outlet, pick another or set null
            let newCurrentOutlet = currentOutlet;
            if (currentOutlet?.id === id) {
                newCurrentOutlet = newOutlets[0] || null;
            }

            set({ outlets: newOutlets, currentOutlet: newCurrentOutlet, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    switchOutlet: async (id: string) => {
        const { outlets, fetchTaxSettings, fetchPaymentMethods } = get();
        const outlet = outlets.find(o => o.id === id);
        if (outlet) {
            set({ currentOutlet: outlet });
            // Refresh specifics for this outlet
            await Promise.all([
                fetchTaxSettings(id),
                fetchPaymentMethods(id)
            ]);
        }
    },
    clearOutlets: () => set({ outlets: [], currentOutlet: null }),
}), {
    name: 'outlet-storage',
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (state) => ({
        currentOutlet: state.currentOutlet,
        outlets: state.outlets
    }),
}));
