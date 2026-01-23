import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { uploadFile, generateFileKey } from "../../../lib/storage";
import { db, file, folder, folderAccess, eq, and } from "@shared-db";
import { nanoid } from "nanoid";
import { getUserPermission, validateUpload, updateStorageUsed } from "../../../lib/permissions";
import { logActivity } from "../../../lib/activity";

export const POST: APIRoute = async ({ request }) => {
    try {
        // Check authentication
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const uploadedFile = formData.get("file") as File | null;
        const folderId = formData.get("folderId") as string | null;

        if (!uploadedFile) {
            return new Response(
                JSON.stringify({ error: "No file provided" }),
                { status: 400 }
            );
        }

        // Get user permission and validate upload
        const permission = await getUserPermission(session.user.id);
        const validation = validateUpload(permission, uploadedFile.size);

        if (!validation.valid) {
            return new Response(
                JSON.stringify({ error: validation.error }),
                { status: 403 }
            );
        }

        // Validate folder access if uploading to a folder
        if (folderId) {
            // Check if folder is owned by user
            const ownedFolder = await db
                .select()
                .from(folder)
                .where(and(eq(folder.id, folderId), eq(folder.userId, session.user.id)))
                .limit(1);

            if (ownedFolder.length === 0) {
                // Check if folder is shared with user with edit permission
                const sharedAccess = await db
                    .select()
                    .from(folderAccess)
                    .where(and(
                        eq(folderAccess.folderId, folderId),
                        eq(folderAccess.sharedWithUserId, session.user.id),
                        eq(folderAccess.permission, "edit")
                    ))
                    .limit(1);

                if (sharedAccess.length === 0) {
                    return new Response(
                        JSON.stringify({ error: "You do not have permission to upload to this folder" }),
                        { status: 403 }
                    );
                }
            }
        }

        // Generate unique key for R2
        const r2Key = generateFileKey(session.user.id, uploadedFile.name);

        // Convert File to ArrayBuffer then to Buffer
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to R2
        const { url } = await uploadFile(r2Key, buffer, uploadedFile.type);

        // Save metadata to database
        const fileId = nanoid();
        const newFile = await db.insert(file).values({
            id: fileId,
            name: uploadedFile.name,
            mimeType: uploadedFile.type,
            size: uploadedFile.size,
            r2Key: r2Key,
            folderId: folderId || null,
            userId: session.user.id,
        }).returning();

        // Update storage used
        await updateStorageUsed(session.user.id, uploadedFile.size);

        // Log activity
        await logActivity({
            userId: session.user.id,
            action: "upload",
            targetType: "file",
            targetId: fileId,
            targetName: uploadedFile.name,
            metadata: {
                size: uploadedFile.size,
                mimeType: uploadedFile.type,
                folderId: folderId || null,
            },
        });

        return new Response(
            JSON.stringify({
                success: true,
                file: {
                    ...newFile[0],
                    url,
                },
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Upload error:", error);
        return new Response(
            JSON.stringify({
                error: "Upload failed",
                details: error instanceof Error ? error.message : String(error),
            }),
            { status: 500 }
        );
    }
};
