import { create } from 'zustand';
import { API_URL } from '../config/api';
import { useAuthStore } from './authStore';

export interface MemberTier {
    id: string;
    name: string;
    minPoints: number;
    discountPercent: string;
    pointMultiplier: string;
    color: string;
    isDefault: boolean;
}

export interface LoyaltySettings {
    pointsPerAmount: number;
    amountPerPoint: number;
    redemptionRate: number;
    redemptionValue: number;
    isEnabled: boolean;
}

interface LoyaltyState {
    tiers: MemberTier[];
    settings: LoyaltySettings | null;
    isLoading: boolean;
    fetchLoyaltyData: (outletId: string) => Promise<void>;
}

export const useLoyaltyStore = create<LoyaltyState>((set) => ({
    tiers: [],
    settings: null,
    isLoading: false,

    fetchLoyaltyData: async (outletId: string) => {
        set({ isLoading: true });
        const token = useAuthStore.getState().token;
        const fetchOptions = {
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            credentials: 'include' as const
        };

        try {
            // Fetch tiers
            const tiersRes = await fetch(`${API_URL}/loyalty/tiers?outletId=${outletId}`, fetchOptions);
            if (tiersRes.ok) {
                const tiersData = await tiersRes.json();
                set({ tiers: tiersData });
            }

            // Fetch settings
            const settingsRes = await fetch(`${API_URL}/loyalty/settings?outletId=${outletId}`, fetchOptions);
            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                set({ settings: settingsData });
            }
        } catch (error) {
            console.error('[LoyaltyStore] Failed to fetch data:', error);
        } finally {
            set({ isLoading: false });
        }
    },
}));
