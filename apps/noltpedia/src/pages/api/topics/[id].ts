import type { APIRoute } from "astro";
import { db, schema, eq } from "../../../lib/db";
import { auth } from "../../../lib/auth";

export const PUT: APIRoute = async ({ request, params }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { id } = params;
    if (!id) return new Response("ID required", { status: 400 });

    const data = await request.json();
    const { name, description, icon, isPublished } = data;

    try {
        await db.update(schema.topics)
            .set({
                name,
                description,
                icon,
                isPublished: isPublished ?? true,
                updatedAt: new Date(),
            })
            .where(eq(schema.topics.id, id));

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};

export const DELETE: APIRoute = async ({ request, params }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { id } = params;
    if (!id) return new Response("ID required", { status: 400 });

    try {
        await db.delete(schema.topics).where(eq(schema.topics.id, id));
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
