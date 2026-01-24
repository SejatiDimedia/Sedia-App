import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { deleteFile, getSignedUrl } from "../../../lib/storage";
import { db, file, eq, and, desc } from "@shared-db";
import { decreaseStorageUsed } from "../../../lib/permissions";
import { logActivity } from "../../../lib/activity";

interface FileRecord {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    r2Key: string;
    folderId: string | null;
    userId: string;
    isDeleted: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

// GET: List deleted files (Trash)
export const GET: APIRoute = async ({ request }) => {
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

        const files = await db
            .select()
            .from(file)
            .where(
                and(
                    eq(file.userId, session.user.id),
                    eq(file.isDeleted, true)
                )
            )
            .orderBy(desc(file.deletedAt)) as FileRecord[];

        // Add signed URLs for preview
        const filesWithUrls = await Promise.all(
            files.map(async (f: FileRecord) => ({
                ...f,
                url: await getSignedUrl(f.r2Key),
            }))
        );

        return new Response(
            JSON.stringify({ files: filesWithUrls }),
            { status: 200 }
        );
    } catch (error) {
        console.error("List trash error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to list trash" }),
            { status: 500 }
        );
    }
};

// POST: Restore file from trash
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

        const { fileId } = await request.json();

        if (!fileId) {
            return new Response(
                JSON.stringify({ error: "File ID required" }),
                { status: 400 }
            );
        }

        // Check ownership and deleted status
        const fileRecords = await db
            .select()
            .from(file)
            .where(
                and(
                    eq(file.id, fileId),
                    eq(file.userId, session.user.id),
                    eq(file.isDeleted, true)
                )
            ) as FileRecord[];

        const fileRecord = fileRecords[0];

        if (!fileRecord) {
            return new Response(
                JSON.stringify({ error: "File not found in trash" }),
                { status: 404 }
            );
        }

        // Restore file
        await db
            .update(file)
            .set({
                isDeleted: false,
                deletedAt: null,
                updatedAt: new Date(),
            })
            .where(eq(file.id, fileId));

        // Log activity
        await logActivity({
            userId: session.user.id,
            action: "restore",
            targetType: "file",
            targetId: fileRecord.id,
            targetName: fileRecord.name,
            metadata: { size: fileRecord.size, mimeType: fileRecord.mimeType },
        });

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Restore file error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to restore file" }),
            { status: 500 }
        );
    }
};

// DELETE: Permanently delete file
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

        const { fileId, emptyTrash } = await request.json();

        // HANDLE EMPTY TRASH
        if (emptyTrash) {
            // Get all deleted files for user
            const allTrashedFiles = await db
                .select()
                .from(file)
                .where(
                    and(
                        eq(file.userId, session.user.id),
                        eq(file.isDeleted, true)
                    )
                ) as FileRecord[];

            if (allTrashedFiles.length === 0) {
                return new Response(JSON.stringify({ success: true }), { status: 200 });
            }

            // Delete from R2 in parallel chunks
            const deletePromises = allTrashedFiles.map(f => deleteFile(f.r2Key));
            await Promise.allSettled(deletePromises);

            // Calculate total size freed
            const totalSize = allTrashedFiles.reduce((acc, f) => acc + f.size, 0);

            // Delete from DB
            await db.delete(file).where(
                and(
                    eq(file.userId, session.user.id),
                    eq(file.isDeleted, true)
                )
            );

            // Update storage usage
            await decreaseStorageUsed(session.user.id, totalSize);

            // Log activity
            await logActivity({
                userId: session.user.id,
                action: "empty_trash",
                targetType: "file",
                targetId: "bulk",
                targetName: `${allTrashedFiles.length} files`,
                metadata: { freedBytes: totalSize, count: allTrashedFiles.length }
            });

            return new Response(JSON.stringify({ success: true }), { status: 200 });
        }

        if (!fileId) {
            return new Response(
                JSON.stringify({ error: "File ID required" }),
                { status: 400 }
            );
        }

        // Check ownership and deleted status
        const fileRecords = await db
            .select()
            .from(file)
            .where(
                and(
                    eq(file.id, fileId),
                    eq(file.userId, session.user.id),
                    eq(file.isDeleted, true)
                )
            ) as FileRecord[];

        const fileRecord = fileRecords[0];

        if (!fileRecord) {
            return new Response(
                JSON.stringify({ error: "File not found in trash" }),
                { status: 404 }
            );
        }

        // Delete from R2
        await deleteFile(fileRecord.r2Key);

        // Delete from database permanently
        await db.delete(file).where(eq(file.id, fileId));

        // Decrease storage used
        await decreaseStorageUsed(session.user.id, fileRecord.size);

        // Log activity
        await logActivity({
            userId: session.user.id,
            action: "permanent_delete",
            targetType: "file",
            targetId: fileRecord.id,
            targetName: fileRecord.name,
            metadata: { size: fileRecord.size, mimeType: fileRecord.mimeType },
        });

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Permanent delete error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to permanently delete file" }),
            { status: 500 }
        );
    }
};
