import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { db } from "./db";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    plugins: [
        bearer(), // Enable Bearer token support
    ],
    trustedOrigins: [
        "http://localhost:8086",
        "http://127.0.0.1:8086",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://10.0.2.2:3000",
        "http://localhost:8081",
        "http://127.0.0.1:8081"
    ],
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    callbacks: {
        session: async ({ session, user }: any) => {
            try {
                console.log("[Auth Callback] Fetching role for user:", user.id, user.email);

                // Ensure we query the database for the latest permission
                const { eq, and } = await import("drizzle-orm");
                const { appPermission } = await import("./schema/auth-schema");

                const permissions = await db
                    .select()
                    .from(appPermission)
                    .where(
                        and(
                            eq(appPermission.userId, user.id),
                            eq(appPermission.appId, "sedia-pos")
                        )
                    );

                const role = permissions[0]?.role || "user";
                console.log("[Auth Callback] Found role:", role, "for app_id: sedia-pos");

                return {
                    ...session,
                    user: {
                        ...user,
                        role: role,
                        _debug_role: role
                    }
                };
            } catch (e) {
                console.error("[Auth Callback] Error:", e);
                return session;
            }
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes
        },
    },
});

export type Session = typeof auth.$Infer.Session;
