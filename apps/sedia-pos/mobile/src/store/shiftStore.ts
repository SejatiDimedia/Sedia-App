import { create } from 'zustand';
import { API_URL } from '../config/api';
import { useAuthStore } from './authStore';

export interface Shift {
    id: string;
    outletId: string;
    employeeId: string;
    startTime: string;
    endTime: string | null;
    startingCash: string;
    endingCash: string | null;
    expectedCash: string | null;
    difference: string | null;
    status: 'open' | 'closed';
    notes: string | null;
}

interface ShiftState {
    activeShift: Shift | null;
    isLoading: boolean;
    error: string | null;
    shiftReconciliation: any | null;

    // Actions
    fetchActiveShift: (outletId: string) => Promise<void>;
    openShift: (outletId: string, employeeId: string, startingCash: number) => Promise<boolean>;
    closeShift: (shiftId: string, endingCash: number, notes: string) => Promise<boolean>;
    clearActiveShift: () => void;
    setShiftReconciliation: (data: any | null) => void;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
    activeShift: null,
    isLoading: false,
    error: null,
    shiftReconciliation: null,

    fetchActiveShift: async (outletId: string) => {
        set({ isLoading: true, error: null });
        const token = useAuthStore.getState().token;
        try {
            const response = await fetch(`${API_URL}/shifts?outletId=${outletId}&status=open`, {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                credentials: 'include',
            });
            if (response.ok) {
                const shifts = await response.json();
                if (shifts && shifts.length > 0) {
                    // Response structure from API is { shift: ..., employee: ... }
                    set({ activeShift: shifts[0].shift, isLoading: false });
                } else {
                    set({ activeShift: null, isLoading: false });
                }
            } else {
                set({ activeShift: null, isLoading: false });
            }
        } catch (error: any) {
            console.error('Failed to fetch active shift:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    openShift: async (outletId: string, employeeId: string, startingCash: number) => {
        set({ isLoading: true, error: null });
        const token = useAuthStore.getState().token;
        try {
            const response = await fetch(`${API_URL}/shifts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                credentials: 'include',
                body: JSON.stringify({
                    outletId,
                    employeeId,
                    startingCash,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to open shift');
            }

            const newShift = await response.json();
            set({ activeShift: newShift, isLoading: false });
            return true;
        } catch (error: any) {
            console.error('Failed to open shift:', error);
            set({ error: error.message, isLoading: false });
            return false;
        }
    },

    closeShift: async (shiftId: string, endingCash: number, notes: string) => {
        set({ isLoading: true, error: null });
        const token = useAuthStore.getState().token;
        try {
            const response = await fetch(`${API_URL}/shifts/${shiftId}/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                credentials: 'include',
                body: JSON.stringify({
                    endingCash,
                    notes,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to close shift');
            }

            const reconciliation = await response.json();
            set({
                shiftReconciliation: reconciliation,
                activeShift: null,
                isLoading: false
            });
            return true;
        } catch (error: any) {
            console.error('Failed to close shift:', error);
            set({ error: error.message, isLoading: false });
            return false;
        }
    },

    clearActiveShift: () => set({ activeShift: null }),
    setShiftReconciliation: (data) => set({ shiftReconciliation: data }),
}));
