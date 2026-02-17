import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: import.meta.env.PUBLIC_APP_URL, // Auto-detected usually, but good to be explicit if needed
});

export const { signIn, signOut, useSession } = authClient;
