/**
 * Update Profile API Route
 * POST /api/settings/profile
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema/auth-schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { name, email } = await request.json();

        if (!name || !email) {
            return NextResponse.json(
                { error: "Name and email are required" },
                { status: 400 }
            );
        }

        // Check if email is already used by another user
        if (email !== session.user.email) {
            const existingUser = await db.query.user.findFirst({
                where: eq(user.email, email)
            });

            if (existingUser && existingUser.id !== session.user.id) {
                return NextResponse.json(
                    { error: "Email sudah digunakan oleh user lain" },
                    { status: 400 }
                );
            }
        }

        // Update user
        await db.update(user)
            .set({
                name,
                email,
                updatedAt: new Date(),
            })
            .where(eq(user.id, session.user.id));

        return NextResponse.json({
            success: true,
            message: "Profile updated successfully"
        });

    } catch (error: any) {
        console.error("Update profile error:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
