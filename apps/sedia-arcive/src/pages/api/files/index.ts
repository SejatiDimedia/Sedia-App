import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { deleteFile, getSignedUrl } from "../../../lib/storage";
import { db, file, eq, and, desc } from "@shared-db";

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
                .select()
                .from(file)
                .where(
                    and(
                        eq(file.userId, session.user.id),
                        eq(file.folderId, folderId)
                    )
                )
                .orderBy(desc(file.createdAt)) as FileRecord[];
        } else {
            files = await db
                .select()
                .from(file)
                .where(eq(file.userId, session.user.id))
                .orderBy(desc(file.createdAt)) as FileRecord[];
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

// DELETE: Delete a file
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

        // Get file to check ownership and get r2Key
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

        // Delete from R2
        await deleteFile(fileRecord.r2Key);

        // Delete from database
        await db.delete(file).where(eq(file.id, fileId));

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
