import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { db, file, fileAccess, user, folder, folderAccess, eq, and } from "@shared-db";
import { logActivity } from "../../../lib/activity";
import { createNotification } from "../../../lib/notifications";

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

        // Send Notification & Email
        // Send Notification & Email
        // Fetch target name if not available in scope (or refactor to capture it earlier)
        let itemName = "content";
        if (folderId) {
            const folderInfo = await db.select().from(folder).where(eq(folder.id, folderId));
            if (folderInfo.length > 0) itemName = `folder "${folderInfo[0].name}"`;
            else itemName = "a folder";
        } else if (fileIds && fileIds.length > 0) {
            itemName = `${filesToShare.length} files`;
        } else if (filesToShare.length === 1) {
            itemName = `file "${filesToShare[0].name}"`;
        }

        const itemType = folderId ? "folder" : "file";
        const link = folderId ? `/dashboard/shared?folderId=${folderId}` : `/dashboard/shared`; // Or deep link to file viewer if we had one

        await createNotification({
            userId: targetUser.id,
            type: folderId ? 'share_folder' : 'share_file',
            title: `New Shared ${folderId ? 'Folder' : 'File'}`,
            message: `${session.user.name} shared ${itemName} with you.`,
            link,
            sendEmailNotification: true,
            emailSubject: `${session.user.name} shared ${itemName} with you on Sedia Arcive`,
            emailHtml: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0f172a;">New Shared Content</h2>
                    <p style="color: #475569; font-size: 16px;">
                        <strong>${session.user.name}</strong> has invited you to collaborate on ${itemName}.
                    </p>
                    <div style="margin: 24px 0;">
                        <a href="${process.env.PUBLIC_APP_URL || 'http://localhost:4321'}${link}" 
                           style="display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
                            Open in Sedia Arcive
                        </a>
                    </div>
                    <p style="color: #94a3b8; font-size: 14px;">
                        You received this email because you have an account on Sedia Arcive.
                    </p>
                </div>
            `
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

// DELETE: Remove file or folder access
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

        const { fileId, folderId, userId } = await request.json();

        if ((!fileId && !folderId) || !userId) {
            return new Response(
                JSON.stringify({ error: "File ID (or Folder ID) and user ID are required" }),
                { status: 400 }
            );
        }

        // Case 1: Unshare File
        if (fileId) {
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
        }
        // Case 2: Unshare Folder
        else if (folderId) {
            // Check if folder belongs to current user
            const folderRecords = await db
                .select()
                .from(folder)
                .where(
                    and(
                        eq(folder.id, folderId),
                        eq(folder.userId, session.user.id)
                    )
                );

            if (!folderRecords.length) {
                return new Response(
                    JSON.stringify({ error: "Folder not found or you don't have permission" }),
                    { status: 404 }
                );
            }

            // Remove access
            await db
                .delete(folderAccess)
                .where(
                    and(
                        eq(folderAccess.folderId, folderId),
                        eq(folderAccess.sharedWithUserId, userId)
                    )
                );
        }

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
