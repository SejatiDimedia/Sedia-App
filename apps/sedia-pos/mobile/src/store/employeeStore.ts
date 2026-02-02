import { create } from 'zustand';
import { API_URL } from '../config/api';
import { useAuthStore } from './authStore';

export interface Employee {
    id: string;
    name: string;
    role: string;
}

interface EmployeeState {
    currentEmployee: Employee | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setCurrentEmployee: (employee: Employee | null) => void;
    verifyPin: (outletId: string, pinCode: string) => Promise<boolean>;
    validatePin: (outletId: string, pinCode: string) => Promise<Employee | null>;
    clearEmployee: () => void;
}

const API_BASE_URL = API_URL;

export const useEmployeeStore = create<EmployeeState>((set) => ({
    currentEmployee: null,
    isLoading: false,
    error: null,

    setCurrentEmployee: (employee) => set({ currentEmployee: employee }),

    verifyPin: async (outletId: string, pinCode: string) => {
        set({ isLoading: true, error: null });
        const token = useAuthStore.getState().token;
        try {
            const response = await fetch(`${API_BASE_URL}/employees/verify-pin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                credentials: 'include',
                body: JSON.stringify({ outletId, pinCode }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'PIN tidak valid');
            }

            const { employee } = await response.json();
            console.log('[EmployeeStore] verifyPin response - storing employee:', employee);
            set({ currentEmployee: employee, isLoading: false });
            return true;
        } catch (error: any) {
            console.error('[EmployeeStore] PIN verification failed:', error);
            set({ error: error.message, isLoading: false });
            return false;
        }
    },

    validatePin: async (outletId: string, pinCode: string) => {
        const token = useAuthStore.getState().token;
        try {
            const response = await fetch(`${API_BASE_URL}/employees/verify-pin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                credentials: 'include',
                body: JSON.stringify({ outletId, pinCode }),
            });

            if (!response.ok) {
                return null;
            }

            const { employee } = await response.json();
            return employee;
        } catch (error) {
            console.error('[EmployeeStore] PIN validation failed:', error);
            return null;
        }
    },

    clearEmployee: () => set({ currentEmployee: null, error: null }),
}));
