import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { db, file, fileAccess, user, folder, folderAccess, eq, and, desc } from "@shared-db";

// GET: List users who have access to a specific file or folder
export const GET: APIRoute = async ({ request, url }) => {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401 }
            );
        }

        const fileId = url.searchParams.get("fileId");
        const folderId = url.searchParams.get("folderId");
        const targetId = url.searchParams.get("targetId") || fileId || folderId;
        const targetType = url.searchParams.get("targetType") || (folderId ? "folder" : "file");

        if (!targetId) {
            return new Response(
                JSON.stringify({ error: "Target ID required" }),
                { status: 400 }
            );
        }

        let accessList = [];

        if (targetType === "folder") {
            // Check ownership
            const folderRecord = await db
                .select()
                .from(folder)
                .where(
                    and(
                        eq(folder.id, targetId),
                        eq(folder.userId, session.user.id)
                    )
                );

            if (!folderRecord.length) {
                return new Response(
                    JSON.stringify({ error: "Folder not found or access denied" }),
                    { status: 404 }
                );
            }

            // Get access list
            accessList = await db
                .select({
                    id: folderAccess.id,
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    permission: folderAccess.permission,
                    sharedAt: folderAccess.sharedAt,
                })
                .from(folderAccess)
                .innerJoin(user, eq(user.id, folderAccess.sharedWithUserId))
                .where(eq(folderAccess.folderId, targetId))
                .orderBy(desc(folderAccess.sharedAt));
        } else {
            // Default to file
            const fileRecord = await db
                .select()
                .from(file)
                .where(
                    and(
                        eq(file.id, targetId),
                        eq(file.userId, session.user.id)
                    )
                );

            if (!fileRecord.length) {
                return new Response(
                    JSON.stringify({ error: "File not found or access denied" }),
                    { status: 404 }
                );
            }

            // Get access list
            accessList = await db
                .select({
                    id: fileAccess.id,
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    permission: fileAccess.permission,
                    sharedAt: fileAccess.sharedAt,
                })
                .from(fileAccess)
                .innerJoin(user, eq(user.id, fileAccess.sharedWithUserId))
                .where(eq(fileAccess.fileId, targetId))
                .orderBy(desc(fileAccess.sharedAt));
        }

        return new Response(
            JSON.stringify({ accessList }),
            { status: 200 }
        );
    } catch (error) {
        console.error("List access error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to list access" }),
            { status: 500 }
        );
    }
};
