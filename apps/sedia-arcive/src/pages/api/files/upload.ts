import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { uploadFile, generateFileKey } from "../../../lib/storage";
import { db, file } from "@shared-db";
import { nanoid } from "nanoid";

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
