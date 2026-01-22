import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: import.meta.env.PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:4321"),
});

export const {
    signIn,
    signUp,
    signOut,
    useSession,
    getSession,
} = authClient;
