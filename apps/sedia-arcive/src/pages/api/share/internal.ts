import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { db, file, fileAccess, user, folder, folderAccess, eq, and } from "@shared-db";
import { logActivity } from "../../../lib/activity";

// Helper: Share a single file with a user
async function shareFileWithUser(
    fileRecord: { id: string; name: string; userId: string },
    targetUserId: string,
    permission: string,
    sharedBy: string
) {
    // Check if already shared
    const existingAccess = await db
        .select()
        .from(fileAccess)
        .where(
            and(
                eq(fileAccess.fileId, fileRecord.id),
                eq(fileAccess.sharedWithUserId, targetUserId)
            )
        );

    if (existingAccess.length > 0) {
        // Update permission if already shared
        await db
            .update(fileAccess)
            .set({ permission })
            .where(eq(fileAccess.id, existingAccess[0].id));
    } else {
        // Create new access record
        await db.insert(fileAccess).values({
            fileId: fileRecord.id,
            sharedWithUserId: targetUserId,
            permission,
            sharedBy,
        });
    }
}

// Helper: Share a folder with a user
async function shareFolderWithUser(
    folderRecord: { id: string; name: string; userId: string },
    targetUserId: string,
    permission: string,
    sharedBy: string
) {
    // Check if already shared
    const existingAccess = await db
        .select()
        .from(folderAccess)
        .where(
            and(
                eq(folderAccess.folderId, folderRecord.id),
                eq(folderAccess.sharedWithUserId, targetUserId)
            )
        );

    if (existingAccess.length > 0) {
        // Update permission
        await db
            .update(folderAccess)
            .set({ permission })
            .where(eq(folderAccess.id, existingAccess[0].id));
    } else {
        // Create new access
        await db.insert(folderAccess).values({
            folderId: folderRecord.id,
            sharedWithUserId: targetUserId,
            permission,
            sharedBy,
        });
    }
}

// POST: Share file(s) with user by email
// Supports: fileId (single), fileIds (bulk), folderId (all files in folder)
export const POST: APIRoute = async ({ request }) => {
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

        const { fileId, fileIds, folderId, email, permission = "view" } = await request.json();

        if (!email) {
            return new Response(
                JSON.stringify({ error: "Email is required" }),
                { status: 400 }
            );
        }

        if (!fileId && (!fileIds || fileIds.length === 0) && !folderId) {
            return new Response(
                JSON.stringify({ error: "File ID, File IDs, or Folder ID is required" }),
                { status: 400 }
            );
        }

        // Find target user by email
        const targetUsers = await db
            .select()
            .from(user)
            .where(eq(user.email, email.toLowerCase()));

        const targetUser = targetUsers[0];

        if (!targetUser) {
            return new Response(
                JSON.stringify({ error: "User not found with that email" }),
                { status: 404 }
            );
        }

        // Can't share with yourself
        if (targetUser.id === session.user.id) {
            return new Response(
                JSON.stringify({ error: "You cannot share with yourself" }),
                { status: 400 }
            );
        }

        let filesToShare: { id: string; name: string; userId: string }[] = [];

        // Case 1: Single file
        if (fileId) {
            const fileRecords = await db
                .select()
                .from(file)
                .where(
                    and(
                        eq(file.id, fileId),
                        eq(file.userId, session.user.id)
                    )
                );

            if (fileRecords.length === 0) {
                return new Response(
                    JSON.stringify({ error: "File not found or you don't have permission" }),
                    { status: 404 }
                );
            }
            filesToShare = fileRecords;
        }
        // Case 2: Bulk file IDs
        else if (fileIds && fileIds.length > 0) {
            for (const fid of fileIds) {
                const fileRecords = await db
                    .select()
                    .from(file)
                    .where(
                        and(
                            eq(file.id, fid),
                            eq(file.userId, session.user.id)
                        )
                    );
                if (fileRecords.length > 0) {
                    filesToShare.push(fileRecords[0]);
                }
            }
        }
        // Case 3: Folder ID - share all files in folder
        else if (folderId) {
            // Verify folder belongs to user
            const folderRecords = await db
                .select()
                .from(folder)
                .where(
                    and(
                        eq(folder.id, folderId),
                        eq(folder.userId, session.user.id)
                    )
                );

            if (folderRecords.length === 0) {
                return new Response(
                    JSON.stringify({ error: "Folder not found or you don't have permission" }),
                    { status: 404 }
                );
            }

            // Share the folder itself (Persistent access)
            await shareFolderWithUser(folderRecords[0], targetUser.id, permission, session.user.id);

            // Get all files in folder
            const filesInFolder = await db
                .select()
                .from(file)
                .where(
                    and(
                        eq(file.folderId, folderId),
                        eq(file.userId, session.user.id)
                    )
                );

            filesToShare = filesInFolder;
        }

        if (filesToShare.length === 0) {
            return new Response(
                JSON.stringify({ error: "No files found to share" }),
                { status: 404 }
            );
        }

        // Share each file
        for (const f of filesToShare) {
            await shareFileWithUser(f, targetUser.id, permission, session.user.id);
        }

        // Log activity (log once for bulk/folder)
        await logActivity({
            userId: session.user.id,
            action: "share",
            targetType: folderId ? "folder" : "file",
            targetId: folderId || fileId || filesToShare[0]?.id,
            targetName: folderId ? `Folder (${filesToShare.length} files)` : filesToShare[0]?.name,
            metadata: { sharedWith: email, permission, filesShared: filesToShare.length },
        });

        return new Response(
            JSON.stringify({
                success: true,
                sharedWith: targetUser.name || targetUser.email,
                filesShared: filesToShare.length
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Share file error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to share file" }),
            { status: 500 }
        );
    }
};

// DELETE: Remove file access
export const DELETE: APIRoute = async ({ request }) => {
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

        const { fileId, userId } = await request.json();

        if (!fileId || !userId) {
            return new Response(
                JSON.stringify({ error: "File ID and user ID are required" }),
                { status: 400 }
            );
        }

        // Check if file belongs to current user
        const fileRecords = await db
            .select()
            .from(file)
            .where(
                and(
                    eq(file.id, fileId),
                    eq(file.userId, session.user.id)
                )
            );

        if (!fileRecords.length) {
            return new Response(
                JSON.stringify({ error: "File not found or you don't have permission" }),
                { status: 404 }
            );
        }

        // Remove access
        await db
            .delete(fileAccess)
            .where(
                and(
                    eq(fileAccess.fileId, fileId),
                    eq(fileAccess.sharedWithUserId, userId)
                )
            );

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Remove share error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to remove access" }),
            { status: 500 }
        );
    }
};
