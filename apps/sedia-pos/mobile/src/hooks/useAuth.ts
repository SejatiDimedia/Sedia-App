import { useAuthStore } from "../store/authStore";

export const useAuth = () => {
    const { user, token, isLoading, login, register, logout, checkSession } = useAuthStore();
    return { user, token, isLoading, login, register, logout, checkSession };
};
