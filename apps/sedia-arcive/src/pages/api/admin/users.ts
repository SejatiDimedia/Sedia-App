import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { db, appPermission, user, eq, and, sql } from "@shared-db";

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

        // AUTO-MIGRATION FIX: Ensure max_file_size column exists
        try {
            await db.execute(sql`
                ALTER TABLE "sedia_auth"."app_permission" 
                ADD COLUMN IF NOT EXISTS "max_file_size" bigint DEFAULT 104857600 NOT NULL
            `);
        } catch (e) {
            console.error("Auto-migration failed:", e);
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

        // Fetch max_file_size using raw SQL to bypass schema sync issues
        let rawPermissions: any = { rows: [] };
        try {
            rawPermissions = await db.execute(sql`
                SELECT user_id, max_file_size FROM sedia_auth.app_permission WHERE app_id = ${APP_ID}
            `);
        } catch (e) {
            console.error("Failed to fetch raw permissions (max_file_size likely missing):", e);
            // Fallback to empty rows, UI will use default
        }

        // Merge users with permissions
        const usersWithPermissions = users.map((u) => {
            const perm = permissions.find((p) => p.userId === u.id);
            const rawPerm = rawPermissions.rows.find((p: any) => p.user_id === u.id) as any;

            return {
                ...u,
                permission: perm ? {
                    id: perm.id,
                    role: perm.role,
                    uploadEnabled: perm.uploadEnabled,
                    storageLimit: perm.storageLimit,
                    maxFileSize: rawPerm?.max_file_size ? Number(rawPerm.max_file_size) : 104857600, // Safe Fallback
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

        const { userId, uploadEnabled, storageLimit, maxFileSize } = await request.json();

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
                storageLimit: storageLimit ?? 524288000,
                // maxFileSize: maxFileSize ?? 104857600, // Safe mode: Insert default via Drizzle (since column is removed from schema)
                storageUsed: 0,
            });

            // Update max_file_size manually if needed and provided
            if (maxFileSize !== undefined) {
                try {
                    await db.execute(sql`
                        UPDATE sedia_auth.app_permission 
                        SET max_file_size = ${maxFileSize} 
                        WHERE user_id = ${userId} AND app_id = ${APP_ID}
                    `);
                } catch (e) {
                    console.error("Failed to update max_file_size (column likely missing using different schema?):", e);
                }
            }
        } else {
            // Update existing permission
            await db
                .update(appPermission)
                .set({
                    uploadEnabled: uploadEnabled ?? existing[0].uploadEnabled,
                    storageLimit: storageLimit ?? existing[0].storageLimit,
                    // maxFileSize: maxFileSize ?? existing[0].maxFileSize,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(appPermission.userId, userId),
                        eq(appPermission.appId, APP_ID)
                    )
                );

            if (maxFileSize !== undefined) {
                try {
                    await db.execute(sql`
                        UPDATE sedia_auth.app_permission 
                        SET max_file_size = ${maxFileSize} 
                        WHERE user_id = ${userId} AND app_id = ${APP_ID}
                    `);
                } catch (e) {
                    console.error("Failed to update max_file_size:", e);
                }
            }
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
