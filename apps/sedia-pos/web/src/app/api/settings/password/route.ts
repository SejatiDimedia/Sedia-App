/**
 * Update Password API Route
 * POST /api/settings/password
 * 
 * Uses better-auth's native changePassword API to ensure
 * password hashing matches the expected format for login verification.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { account, user } from "@/lib/schema/auth-schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const reqHeaders = await headers();
        const session = await auth.api.getSession({
            headers: reqHeaders
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Current password and new password are required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: "Password minimal 8 karakter" },
                { status: 400 }
            );
        }

        // Check if user has a credential account
        const userAccount = await db.query.account.findFirst({
            where: and(
                eq(account.userId, session.user.id),
                eq(account.providerId, "credential")
            )
        });

        if (!userAccount) {
            return NextResponse.json(
                { error: "Akun credential tidak ditemukan. Anda mungkin login dengan Google." },
                { status: 400 }
            );
        }

        // Use better-auth's native changePassword API
        // This ensures password is hashed correctly for login verification
        try {
            await auth.api.changePassword({
                body: {
                    currentPassword,
                    newPassword,
                    revokeOtherSessions: false, // Keep other sessions active
                },
                headers: reqHeaders,
            });

            return NextResponse.json({
                success: true,
                message: "Password updated successfully"
            });

        } catch (err: any) {
            console.error("Change password failed:", err);

            // Check for specific error messages
            const errorMessage = err?.message || err?.body?.message || "";

            if (errorMessage.includes("Invalid password") ||
                errorMessage.includes("incorrect") ||
                errorMessage.includes("wrong")) {
                return NextResponse.json(
                    { error: "Password saat ini tidak benar" },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { error: "Gagal memperbarui password. Pastikan password saat ini benar." },
                { status: 400 }
            );
        }

    } catch (error: any) {
        console.error("Update password error:", error);
        return NextResponse.json(
            { error: "Failed to update password" },
            { status: 500 }
        );
    }
}
