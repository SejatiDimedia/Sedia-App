import type { APIRoute } from "astro";
import { auth } from "../../lib/auth";
import { db, file, folder, eq, and, sql } from "@shared-db";

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

        const url = new URL(request.url);
        const query = url.searchParams.get("q")?.trim();

        if (!query || query.length < 2) {
            return new Response(JSON.stringify({ error: "Query must be at least 2 characters" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const searchPattern = `%${query.toLowerCase()}%`;

        // Search files
        const files = await db
            .select()
            .from(file)
            .where(
                and(
                    eq(file.userId, session.user.id),
                    sql`LOWER(${file.name}) LIKE ${searchPattern}`
                )
            )
            .limit(20);

        // Search folders
        const folders = await db
            .select()
            .from(folder)
            .where(
                and(
                    eq(folder.userId, session.user.id),
                    sql`LOWER(${folder.name}) LIKE ${searchPattern}`
                )
            )
            .limit(10);

        // Format file results with URLs
        const publicUrl = import.meta.env.R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;
        const formattedFiles = files.map((f) => ({
            ...f,
            url: `${publicUrl}/${f.r2Key}`,
            type: "file" as const,
        }));

        const formattedFolders = folders.map((f) => ({
            ...f,
            type: "folder" as const,
        }));

        return new Response(JSON.stringify({
            files: formattedFiles,
            folders: formattedFolders,
            query
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Search error:", error);
        return new Response(JSON.stringify({ error: "Search failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
