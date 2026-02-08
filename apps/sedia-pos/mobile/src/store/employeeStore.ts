import { create } from 'zustand';
import { API_URL } from '../config/api';
import { useAuthStore } from './authStore';

export interface Employee {
    id: string;
    name: string;
    role: string;
    roleId?: string | null;
    permissions?: string[];
    _server_tag?: string;
    _debug_hit_at?: string;
}

interface EmployeeState {
    employees: Employee[];
    currentEmployee: Employee | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setCurrentEmployee: (employee: Employee | null) => void;
    fetchEmployees: (outletId: string) => Promise<void>;
    verifyPin: (outletId: string, pinCode: string) => Promise<boolean>;
    validatePin: (outletId: string, pinCode: string) => Promise<Employee | null>;
    clearEmployee: () => void;
}

const API_BASE_URL = API_URL;

export const useEmployeeStore = create<EmployeeState>((set) => ({
    currentEmployee: null,
    employees: [],
    isLoading: false,
    error: null,

    setCurrentEmployee: (employee) => set({ currentEmployee: employee }),

    fetchEmployees: async (outletId: string) => {
        set({ isLoading: true, error: null });
        const token = useAuthStore.getState().token;
        try {
            const response = await fetch(`${API_BASE_URL}/employees?outletId=${outletId}`, {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Map backend employees to frontend type if needed, or assume match
                const mappedEmployees: Employee[] = data.map((e: any) => ({
                    id: e.id,
                    name: e.name,
                    role: e.role,
                    roleId: e.roleId,
                    permissions: e.permissions || [],
                }));
                set({ employees: mappedEmployees, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error: any) {
            console.error('[EmployeeStore] Failed to fetch employees:', error);
            set({ error: error.message, isLoading: false });
        }
    },

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

            // Map backend employee to frontend Employee interface
            const employeeData: Employee = {
                id: employee.id,
                name: employee.name,
                role: employee.role,
                roleId: employee.roleId,
                permissions: employee.permissions || [],
                _server_tag: employee._server_tag,
                _debug_hit_at: employee._debug_hit_at
            };

            set({ currentEmployee: employeeData, isLoading: false });
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
            return {
                id: employee.id,
                name: employee.name,
                role: employee.role,
                roleId: employee.roleId,
                permissions: employee.permissions || [],
                _server_tag: employee._server_tag,
                _debug_hit_at: employee._debug_hit_at
            };
        } catch (error) {
            console.error('[EmployeeStore] PIN validation failed:', error);
            return null;
        }
    },

    clearEmployee: () => set({ currentEmployee: null, error: null }),
}));
