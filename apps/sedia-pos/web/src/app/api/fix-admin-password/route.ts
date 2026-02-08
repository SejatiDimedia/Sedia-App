/**
 * Fix Admin Password API Route
 * 
 * Re-hashes the admin user's password with the correct scrypt algorithm.
 * 
 * GET /api/fix-admin-password?email=admin@sedia.pos&password=SediaAdmin123!
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, account } from "@/lib/schema/auth-schema";
import { eq, and } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Hash password using scrypt (same as better-auth default)
async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const email = searchParams.get("email") || "admin@sedia.pos";
    const password = searchParams.get("password") || "SediaAdmin123!";

    try {
        // Find user
        const existingUser = await db.query.user.findFirst({
            where: eq(user.email, email)
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: "User not found", email },
                { status: 404 }
            );
        }

        // Hash new password with scrypt
        const hashedPassword = await hashPassword(password);

        // Update account password
        const result = await db.update(account)
            .set({
                password: hashedPassword,
                updatedAt: new Date()
            })
            .where(and(
                eq(account.userId, existingUser.id),
                eq(account.providerId, "credential")
            ));

        return NextResponse.json({
            success: true,
            message: "Password updated with correct scrypt hash",
            email,
            userId: existingUser.id
        });

    } catch (error: any) {
        console.error("Fix admin password error:", error);
        return NextResponse.json(
            { error: "Failed to fix password", details: error.message },
            { status: 500 }
        );
    }
}
