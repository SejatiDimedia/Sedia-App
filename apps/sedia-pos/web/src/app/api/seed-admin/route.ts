/**
 * Seed Admin API Route
 * 
 * Triggers the creation of a default admin user via HTTP request.
 * Uses better-auth's signUpEmail to properly hash passwords.
 * 
 * GET /api/seed-admin
 * 
 * Query Parameters:
 * - email: Admin email (optional, default: admin@sedia.pos)
 * - password: Admin password (optional, default: SediaAdmin123!)
 * - name: Admin name (optional, default: Administrator)
 * - secret: Security token to prevent unauthorized access (required in production)
 * 
 * Example: /api/seed-admin?email=admin@example.com&password=MyPass123
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, appPermission } from "@/lib/schema/auth-schema";
import { outlets } from "@/lib/schema/sedia-pos";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

// Security: Set this environment variable in production to prevent unauthorized seeding
const SEED_SECRET = process.env.SEED_ADMIN_SECRET;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    // Security check in production
    if (process.env.NODE_ENV === "production") {
        const providedSecret = searchParams.get("secret");
        if (!SEED_SECRET || providedSecret !== SEED_SECRET) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid or missing secret" },
                { status: 401 }
            );
        }
    }

    const email = searchParams.get("email") || process.env.ADMIN_EMAIL || "admin@sedia.pos";
    const password = searchParams.get("password") || process.env.ADMIN_PASSWORD || "SediaAdmin123!";
    const name = searchParams.get("name") || process.env.ADMIN_NAME || "Administrator";

    try {
        // 1. Check if admin already exists
        const existingUser = await db.query.user.findFirst({
            where: eq(user.email, email)
        });

        if (existingUser) {
            // Make sure they have admin permission
            const existingPerm = await db.query.appPermission.findFirst({
                where: and(
                    eq(appPermission.userId, existingUser.id),
                    eq(appPermission.appId, "sedia-pos")
                )
            });

            if (!existingPerm) {
                await db.insert(appPermission).values({
                    userId: existingUser.id,
                    appId: "sedia-pos",
                    role: "admin",
                    uploadEnabled: true,
                });
                return NextResponse.json({
                    success: true,
                    message: "Admin permission added to existing user",
                    email,
                    action: "permission_added"
                });
            } else if (existingPerm.role !== "admin") {
                await db.update(appPermission)
                    .set({ role: "admin" })
                    .where(eq(appPermission.id, existingPerm.id));
                return NextResponse.json({
                    success: true,
                    message: "Existing user upgraded to admin role",
                    email,
                    action: "role_upgraded"
                });
            } else {
                return NextResponse.json({
                    success: true,
                    message: "Admin user already exists with admin role",
                    email,
                    action: "already_exists"
                });
            }
        }

        // 2. Create the user using better-auth's signUpEmail API
        // This ensures proper password hashing
        const newUserResult = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            },
            asResponse: false
        });

        if (!newUserResult?.user?.id) {
            return NextResponse.json(
                { error: "Failed to create user via auth API" },
                { status: 500 }
            );
        }

        const userId = newUserResult.user.id;

        // 3. Create app permission with admin role
        await db.insert(appPermission).values({
            userId: userId,
            appId: "sedia-pos",
            role: "admin",
            uploadEnabled: true,
        });

        // 4. Create a default outlet for the admin
        await db.insert(outlets).values({
            id: crypto.randomUUID(),
            name: "Outlet Utama",
            ownerId: userId,
            address: "Alamat Default",
            phone: "",
            primaryColor: "#2e6a69",
            secondaryColor: "#f2b30c",
        });

        return NextResponse.json({
            success: true,
            message: "Admin user created successfully",
            email,
            name,
            outletName: "Outlet Utama",
            action: "created",
            warning: "IMPORTANT: Change the password after first login!"
        });

    } catch (error: any) {
        console.error("Seed admin error:", error);

        // Handle specific error for duplicate email
        if (error?.body?.message?.includes("already exists") ||
            error?.code === "23505") {
            return NextResponse.json({
                success: true,
                message: "User with this email may already exist",
                email,
                action: "already_exists"
            });
        }

        return NextResponse.json(
            { error: "Failed to seed admin", details: error.message },
            { status: 500 }
        );
    }
}
