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
        const query = url.searchParams.get("q")?.trim() || "";
        const typeFilter = url.searchParams.get("type");
        const starredFilter = url.searchParams.get("starred") === "true";
        const dateFilter = url.searchParams.get("date");

        const hasFilters = (typeFilter && typeFilter !== "all") || starredFilter || (dateFilter && dateFilter !== "all");

        if (query.length < 2 && !hasFilters) {
            return new Response(JSON.stringify({ error: "Query must be at least 2 characters or use filters" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const searchPattern = query ? `%${query.toLowerCase()}%` : null;

        // Date calculation
        let dateCondition = undefined;
        if (dateFilter && dateFilter !== "all") {
            const now = new Date();
            let pastDate = new Date();
            if (dateFilter === "today") pastDate.setHours(0, 0, 0, 0);
            if (dateFilter === "week") pastDate.setDate(now.getDate() - 7);
            if (dateFilter === "month") pastDate.setMonth(now.getMonth() - 1);
            if (dateFilter === "year") pastDate.setFullYear(now.getFullYear() - 1);

            // Using raw SQL to avoid type mismatches with gte/lte helpers on some setups
            dateCondition = sql`${file.createdAt} >= ${pastDate.toISOString()}`;
        }

        // Search files
        const fileConditions = [
            eq(file.userId, session.user.id)
        ];

        if (searchPattern) {
            fileConditions.push(sql`LOWER(${file.name}) LIKE ${searchPattern}`);
        }

        if (starredFilter) {
            fileConditions.push(eq(file.isStarred, true));
        }

        if (dateCondition) {
            fileConditions.push(dateCondition);
        }

        if (typeFilter && typeFilter !== "all" && typeFilter !== "folder") {
            if (typeFilter === "image") fileConditions.push(sql`${file.mimeType} LIKE 'image/%'`);
            if (typeFilter === "video") fileConditions.push(sql`${file.mimeType} LIKE 'video/%'`);
            if (typeFilter === "audio") fileConditions.push(sql`${file.mimeType} LIKE 'audio/%'`);
            if (typeFilter === "document") fileConditions.push(sql`${file.mimeType} = 'application/pdf'`);
        }

        const files = await db
            .select()
            .from(file)
            .where(and(...fileConditions))
            .limit(20);

        // Search folders (only if filter includes folders or is 'all')
        let folders: any[] = [];
        if (!typeFilter || typeFilter === "all" || typeFilter === "folder") {
            const folderConditions = [
                eq(folder.userId, session.user.id)
            ];

            if (searchPattern) {
                folderConditions.push(sql`LOWER(${folder.name}) LIKE ${searchPattern}`);
            }

            if (starredFilter) {
                folderConditions.push(eq(folder.isStarred, true));
            }

            if (dateFilter && dateFilter !== "all") {
                const now = new Date();
                let pastDate = new Date();
                if (dateFilter === "today") pastDate.setHours(0, 0, 0, 0);
                if (dateFilter === "week") pastDate.setDate(now.getDate() - 7);
                if (dateFilter === "month") pastDate.setMonth(now.getMonth() - 1);
                if (dateFilter === "year") pastDate.setFullYear(now.getFullYear() - 1);

                folderConditions.push(sql`${folder.createdAt} >= ${pastDate.toISOString()}`);
            }

            folders = await db
                .select()
                .from(folder)
                .where(and(...folderConditions))
                .limit(10);
        }

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
