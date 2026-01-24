import type { APIRoute } from "astro";
import { auth } from "../../lib/auth";
import { db, file, folder, eq, sql } from "@shared-db";
import { getUserPermission } from "../../lib/permissions";

export const GET: APIRoute = async ({ request }) => {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Get total files count and size
        const fileStats = await db
            .select({
                totalFiles: sql<number>`COUNT(*)`,
                totalSize: sql<number>`COALESCE(SUM(${file.size}), 0)`,
            })
            .from(file)
            .where(eq(file.userId, session.user.id));

        // Get folder count
        const folderStats = await db
            .select({
                totalFolders: sql<number>`COUNT(*)`,
            })
            .from(folder)
            .where(eq(folder.userId, session.user.id));

        // Get user permission for storage limits
        const permission = await getUserPermission(session.user.id);

        const stats = {
            totalFiles: Number(fileStats[0]?.totalFiles || 0),
            totalSize: Number(fileStats[0]?.totalSize || 0),
            totalFolders: Number(folderStats[0]?.totalFolders || 0),
            // Permission data
            uploadEnabled: permission.uploadEnabled,
            storageLimit: permission.storageLimit,
            storageUsed: permission.storageUsed,
            storageRemaining: permission.storageLimit - permission.storageUsed,
            maxFileSize: permission.maxFileSize ?? 104857600,
            role: permission.role,
        };

        return new Response(JSON.stringify(stats), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Stats error:", error);
        return new Response(JSON.stringify({ error: "Failed to get stats" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
