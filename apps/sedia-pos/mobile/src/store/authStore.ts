import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { API_URL } from '../config/api';

interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

async function saveToken(token: string) {
    if (Platform.OS === 'web') {
        localStorage.setItem('auth_token', token);
    } else {
        await SecureStore.setItemAsync('auth_token', token);
    }
}

async function getToken() {
    if (Platform.OS === 'web') {
        return localStorage.getItem('auth_token');
    } else {
        return await SecureStore.getItemAsync('auth_token');
    }
}

async function removeToken() {
    if (Platform.OS === 'web') {
        localStorage.removeItem('auth_token');
    } else {
        await SecureStore.deleteItemAsync('auth_token');
    }
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/auth/sign-in/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error("[AuthStore] Login response parse error:", responseText);
                throw new Error(`Server Error (${response.status})`);
            }

            if (!response.ok) {
                console.error("[AuthStore] Login failed:", data);
                throw new Error(data.message || data.error || 'Login failed');
            }

            // Exhaustive token extraction for BetterAuth
            const token = data.session?.token || data.token || data.sessionToken || data.idToken;
            const user = data.user;

            if (!token) {
                console.error("[AuthStore] No token found in successful login response. Data keys:", Object.keys(data));
                throw new Error('Authentication token not received from server');
            }

            console.log("[AuthStore] Login successful, token acquired");
            await saveToken(token);
            set({ user, token, isLoading: false });
        } catch (error: any) {
            console.error("[AuthStore] Login error:", error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/auth/sign-up/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            const token = data.session?.token || data.token || data.sessionToken;
            const user = data.user;

            if (!token) {
                throw new Error('Registration successful but token not received');
            }

            await saveToken(token);
            set({ user, token, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            await fetch(`${API_URL}/auth/sign-out`, { method: 'POST' });
        } catch (e) { }
        await removeToken();
        set({ user: null, token: null, isLoading: false });
    },

    checkSession: async () => {
        set({ isLoading: true });
        try {
            const token = await getToken();
            if (token) {
                const response = await fetch(`${API_URL}/auth/get-session`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    set({ token, user: data.user });
                } else {
                    console.log("[AuthStore] Session expired or invalid");
                    await removeToken();
                    set({ token: null, user: null });
                }
            }
        } catch (error) {
            console.error("[AuthStore] Session check error:", error);
        } finally {
            set({ isLoading: false });
        }
    },
}));
