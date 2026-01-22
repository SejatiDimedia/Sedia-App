import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { db, appPermission, user, eq, and } from "@shared-db";

const APP_ID = "sedia-arcive";

// GET: List all users with their permissions
export const GET: APIRoute = async ({ request }) => {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // Check if user is admin
        const adminCheck = await db
            .select()
            .from(appPermission)
            .where(
                and(
                    eq(appPermission.userId, session.user.id),
                    eq(appPermission.appId, APP_ID),
                    eq(appPermission.role, "admin")
                )
            );

        if (adminCheck.length === 0) {
            return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), { status: 403 });
        }

        // Get all users with their permissions for this app
        const users = await db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                createdAt: user.createdAt,
            })
            .from(user);

        // Get permissions for all users
        const permissions = await db
            .select()
            .from(appPermission)
            .where(eq(appPermission.appId, APP_ID));

        // Merge users with permissions
        const usersWithPermissions = users.map((u) => {
            const perm = permissions.find((p) => p.userId === u.id);
            return {
                ...u,
                permission: perm ? {
                    id: perm.id,
                    role: perm.role,
                    uploadEnabled: perm.uploadEnabled,
                    storageLimit: perm.storageLimit,
                    storageUsed: perm.storageUsed,
                } : null,
            };
        });

        return new Response(JSON.stringify({ users: usersWithPermissions }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Admin users error:", error);
        return new Response(JSON.stringify({ error: "Failed to list users" }), { status: 500 });
    }
};

// PATCH: Update user permission
export const PATCH: APIRoute = async ({ request }) => {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // Check if user is admin
        const adminCheck = await db
            .select()
            .from(appPermission)
            .where(
                and(
                    eq(appPermission.userId, session.user.id),
                    eq(appPermission.appId, APP_ID),
                    eq(appPermission.role, "admin")
                )
            );

        if (adminCheck.length === 0) {
            return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), { status: 403 });
        }

        const { userId, uploadEnabled } = await request.json();

        if (!userId) {
            return new Response(JSON.stringify({ error: "User ID required" }), { status: 400 });
        }

        // Check if permission exists
        const existing = await db
            .select()
            .from(appPermission)
            .where(
                and(
                    eq(appPermission.userId, userId),
                    eq(appPermission.appId, APP_ID)
                )
            );

        if (existing.length === 0) {
            // Create new permission
            await db.insert(appPermission).values({
                userId,
                appId: APP_ID,
                role: "user",
                uploadEnabled: uploadEnabled ?? false,
                storageLimit: 524288000,
                storageUsed: 0,
            });
        } else {
            // Update existing permission
            await db
                .update(appPermission)
                .set({
                    uploadEnabled: uploadEnabled ?? existing[0].uploadEnabled,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(appPermission.userId, userId),
                        eq(appPermission.appId, APP_ID)
                    )
                );
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Admin update error:", error);
        return new Response(JSON.stringify({ error: "Failed to update permission" }), { status: 500 });
    }
};
