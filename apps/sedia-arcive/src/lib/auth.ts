import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
    user,
    session,
    account,
    verification
} from "./schema";

// Create database connection
const sql = neon(import.meta.env.DATABASE_URL);
const db = drizzle(sql);

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user,
            session,
            account,
            verification,
        },
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: import.meta.env.GOOGLE_CLIENT_ID,
            clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET,
        },
    },
    trustedOrigins: [
        "http://localhost:4321",
        "http://localhost:3000",
    ],
});

export type Auth = typeof auth;
