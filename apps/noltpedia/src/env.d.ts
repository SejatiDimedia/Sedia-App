/// <reference path="../.astro/types.d.ts" />

declare namespace App {
    interface Locals {
        user: {
            id: string;
            email: string;
            name: string;
            image?: string | null | undefined;
            emailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        session: {
            id: string;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined;
            userAgent?: string | null | undefined;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    }
}
