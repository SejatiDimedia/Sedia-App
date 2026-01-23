import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { deleteFile, getSignedUrl } from "../../../lib/storage";
import { db, file, folder, eq, and, desc } from "@shared-db";
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
    createdAt: Date;
    updatedAt: Date;
}

// GET: List user's files
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

        const folderId = url.searchParams.get("folderId");

        let files: FileRecord[];

        if (folderId) {
            files = await db
                .select({
                    id: file.id,
                    name: file.name,
                    mimeType: file.mimeType,
                    size: file.size,
                    r2Key: file.r2Key,
                    folderId: file.folderId,
                    userId: file.userId,
                    createdAt: file.createdAt,
                    updatedAt: file.updatedAt,
                    folderName: folder.name
                })
                .from(file)
                .leftJoin(folder, eq(file.folderId, folder.id))
                .where(
                    and(
                        eq(file.userId, session.user.id),
                        eq(file.folderId, folderId),
                        eq(file.isDeleted, false)
                    )
                )
                .orderBy(desc(file.createdAt)) as any[]; // Cast to any to avoid type mismatch with partial selection
        } else {
            files = await db
                .select({
                    id: file.id,
                    name: file.name,
                    mimeType: file.mimeType,
                    size: file.size,
                    r2Key: file.r2Key,
                    folderId: file.folderId,
                    userId: file.userId,
                    createdAt: file.createdAt,
                    updatedAt: file.updatedAt,
                    folderName: folder.name
                })
                .from(file)
                .leftJoin(folder, eq(file.folderId, folder.id))
                .where(
                    and(
                        eq(file.userId, session.user.id),
                        eq(file.isDeleted, false)
                    )
                )
                .orderBy(desc(file.createdAt)) as any[];
        }

        // Add signed URLs for each file
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
        console.error("List files error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to list files" }),
            { status: 500 }
        );
    }
};

// DELETE: Soft-delete a file (move to trash)
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

        const { fileId } = await request.json();

        if (!fileId) {
            return new Response(
                JSON.stringify({ error: "File ID required" }),
                { status: 400 }
            );
        }

        // Get file to check ownership
        const fileRecords = await db
            .select()
            .from(file)
            .where(
                and(
                    eq(file.id, fileId),
                    eq(file.userId, session.user.id)
                )
            ) as FileRecord[];

        const fileRecord = fileRecords[0];

        if (!fileRecord) {
            return new Response(
                JSON.stringify({ error: "File not found" }),
                { status: 404 }
            );
        }

        // Soft-delete: move to trash
        await db
            .update(file)
            .set({
                isDeleted: true,
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(file.id, fileId));

        // Log activity
        await logActivity({
            userId: session.user.id,
            action: "delete",
            targetType: "file",
            targetId: fileRecord.id,
            targetName: fileRecord.name,
            metadata: {
                size: fileRecord.size,
                mimeType: fileRecord.mimeType,
            },
        });

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Delete file error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to delete file" }),
            { status: 500 }
        );
    }
};

// PUT: Move a file
export const PUT: APIRoute = async ({ request }) => {
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

        const { fileId, folderId } = await request.json();

        if (!fileId) {
            return new Response(
                JSON.stringify({ error: "File ID required" }),
                { status: 400 }
            );
        }

        // Check if file exists and belongs to user
        const fileRecord = await db
            .select()
            .from(file)
            .where(and(eq(file.id, fileId), eq(file.userId, session.user.id)))
            .limit(1);

        if (!fileRecord.length) {
            return new Response(
                JSON.stringify({ error: "File not found" }),
                { status: 404 }
            );
        }

        // Update file's folderId
        await db
            .update(file)
            .set({
                folderId: folderId || null,
                updatedAt: new Date()
            })
            .where(eq(file.id, fileId));

        // Log activity
        await logActivity({
            userId: session.user.id,
            action: "move",
            targetType: "file",
            targetId: fileId,
            targetName: fileRecord[0].name,
            metadata: {
                fromFolderId: fileRecord[0].folderId,
                toFolderId: folderId || null,
            },
        });

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Move file error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to move file" }),
            { status: 500 }
        );
    }
};
