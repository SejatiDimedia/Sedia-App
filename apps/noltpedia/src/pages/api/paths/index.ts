import type { APIRoute } from "astro";
import { db, paths, desc, eq } from "../../../lib/db";
import { nanoid } from "nanoid";

export const GET: APIRoute = async () => {
    try {
        const data = await db.query.paths.findMany({
            orderBy: [desc(paths.createdAt)],
        });
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch paths" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { title, description, slug, isPublished } = body;

        const id = nanoid();
        await db.insert(paths).values({
            id,
            title,
            description,
            slug,
            isPublished: isPublished || false,
        });

        return new Response(JSON.stringify({ id }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Failed to create path" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
