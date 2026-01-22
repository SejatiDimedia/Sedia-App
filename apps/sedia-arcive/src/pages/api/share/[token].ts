import type { APIRoute } from "astro";
import { db, shareLink, file, folder, eq } from "@shared-db";
import { getSignedUrl } from "../../../lib/storage";

interface FileRecord {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    r2Key: string;
    folderId: string | null;
    userId: string;
}

interface FolderRecord {
    id: string;
    name: string;
    parentId: string | null;
    userId: string;
}

export const GET: APIRoute = async ({ params, request, url }) => {
    try {
        const { token } = params;

        if (!token) {
            return new Response(JSON.stringify({ error: "Token is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Find share link
        const links = await db
            .select()
            .from(shareLink)
            .where(eq(shareLink.token, token))
            .limit(1);

        if (links.length === 0) {
            return new Response(JSON.stringify({ error: "Share link not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        const link = links[0];

        // Check expiration
        if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
            return new Response(JSON.stringify({ error: "Share link has expired" }), {
                status: 410,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Check password if required
        if (link.password) {
            const providedPassword = url.searchParams.get("password");
            if (providedPassword !== link.password) {
                return new Response(
                    JSON.stringify({
                        error: "Password required",
                        requiresPassword: true,
                    }),
                    {
                        status: 401,
                        headers: { "Content-Type": "application/json" },
                    }
                );
            }
        }

        // Get target content
        if (link.targetType === "file") {
            const files = await db
                .select()
                .from(file)
                .where(eq(file.id, link.targetId))
                .limit(1);

            if (files.length === 0) {
                return new Response(JSON.stringify({ error: "File not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const fileRecord = files[0] as FileRecord;
            const fileUrl = await getSignedUrl(fileRecord.r2Key);

            return new Response(
                JSON.stringify({
                    type: "file",
                    file: {
                        id: fileRecord.id,
                        name: fileRecord.name,
                        mimeType: fileRecord.mimeType,
                        size: fileRecord.size,
                        url: fileUrl,
                    },
                    allowDownload: link.allowDownload === "true",
                }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                }
            );
        } else {
            // Folder
            const folders = await db
                .select()
                .from(folder)
                .where(eq(folder.id, link.targetId))
                .limit(1);

            if (folders.length === 0) {
                return new Response(JSON.stringify({ error: "Folder not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const folderRecord = folders[0] as FolderRecord;

            // Get files in folder
            const filesInFolder = (await db
                .select()
                .from(file)
                .where(eq(file.folderId, link.targetId))) as FileRecord[];

            // Get signed URLs for all files
            const filesWithUrls = await Promise.all(
                filesInFolder.map(async (f) => ({
                    id: f.id,
                    name: f.name,
                    mimeType: f.mimeType,
                    size: f.size,
                    url: await getSignedUrl(f.r2Key),
                }))
            );

            // Get subfolders
            const subfolders = (await db
                .select()
                .from(folder)
                .where(eq(folder.parentId, link.targetId))) as FolderRecord[];

            return new Response(
                JSON.stringify({
                    type: "folder",
                    folder: {
                        id: folderRecord.id,
                        name: folderRecord.name,
                    },
                    files: filesWithUrls,
                    subfolders: subfolders.map((sf) => ({
                        id: sf.id,
                        name: sf.name,
                    })),
                    allowDownload: link.allowDownload === "true",
                }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
    } catch (error) {
        console.error("Get shared content error:", error);
        return new Response(JSON.stringify({ error: "Failed to get shared content" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
