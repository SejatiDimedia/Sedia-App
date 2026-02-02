import { create } from 'zustand';
import { API_URL } from '../config/api';
import { useAuthStore } from './authStore';

export interface Outlet {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
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
    isLoading: boolean;
    error: string | null;

    // Actions
    setOutlets: (outlets: Outlet[]) => void;
    setCurrentOutlet: (outlet: Outlet | null) => void;
    fetchOutlets: (token?: string) => Promise<void>;
    fetchTaxSettings: (outletId: string) => Promise<void>; // Added action
    clearOutlets: () => void;
}

const API_BASE_URL = API_URL;

export const useOutletStore = create<OutletState>((set, get) => ({
    outlets: [],
    currentOutlet: null,
    taxSettings: null,
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
                        },
                    ],
                    isLoading: false,
                });
                return;
            }

            set({ outlets, isLoading: false });
        } catch (error: any) {
            console.error('[OutletStore] Error fetching outlets:', error);
            // Fallback to default outlet
            set({
                outlets: [
                    {
                        id: 'default-outlet',
                        name: 'Outlet Utama',
                        address: 'Jl. Contoh No. 1',
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
        } catch (error) {
            console.error('[OutletStore] Failed to fetch tax settings:', error);
            set({ taxSettings: null });
        }
    },

    clearOutlets: () => set({ outlets: [], currentOutlet: null }),
}));
