/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly DATABASE_URL: string;
    readonly BETTER_AUTH_SECRET: string;
    readonly GOOGLE_CLIENT_ID: string;
    readonly GOOGLE_CLIENT_SECRET: string;
    readonly PUBLIC_APP_URL: string;
    readonly R2_ACCOUNT_ID: string;
    readonly R2_ACCESS_KEY_ID: string;
    readonly R2_SECRET_ACCESS_KEY: string;
    readonly R2_BUCKET_NAME: string;
    readonly R2_PUBLIC_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare namespace App {
    interface Locals {
        user?: {
            id: string;
            name: string;
            email: string;
            image?: string;
        };
        session?: {
            id: string;
            userId: string;
            expiresAt: Date;
        };
    }
}
