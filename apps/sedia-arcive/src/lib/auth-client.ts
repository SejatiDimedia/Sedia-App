import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : (import.meta.env.PUBLIC_APP_URL || "http://localhost:4321"),
});

export const {
    signIn,
    signUp,
    signOut,
    useSession,
    getSession,
} = authClient;
