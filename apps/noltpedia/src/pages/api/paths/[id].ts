import type { APIRoute } from "astro";
import { db, paths, eq } from "../../../lib/db";

export const PUT: APIRoute = async ({ params, request }) => {
    try {
        const { id } = params;
        if (!id) return new Response(JSON.stringify({ error: "ID required" }), { status: 400 });

        const body = await request.json();
        const { title, description, slug, isPublished } = body;

        await db.update(paths)
            .set({
                title,
                description,
                slug,
                isPublished: isPublished ?? false,
                // updatedAt is handled by DB default or manually if needed
            })
            .where(eq(paths.id, id));

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Failed to update path" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

export const DELETE: APIRoute = async ({ params }) => {
    try {
        const { id } = params;
        if (!id) return new Response(JSON.stringify({ error: "ID required" }), { status: 400 });

        await db.delete(paths).where(eq(paths.id, id));

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Failed to delete path" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
