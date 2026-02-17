import type { APIRoute } from "astro";
import { db, schema, eq } from "../../../lib/db";
import { auth } from "../../../lib/auth";

export const GET: APIRoute = async ({ request, params }) => {
    const { id } = params;
    if (!id) return new Response("ID required", { status: 400 });

    try {
        const article = await db.query.articles.findFirst({
            where: eq(schema.articles.id, id),
        });

        if (!article) {
            return new Response("Article not found", { status: 404 });
        }

        return new Response(JSON.stringify(article), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};

export const PUT: APIRoute = async ({ request, params }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { id } = params;
    if (!id) return new Response("ID required", { status: 400 });

    const data = await request.json();
    const { title, slug, content, topicId, isPublished } = data;

    try {
        await db.update(schema.articles)
            .set({
                title,
                slug,
                content,
                topicId,
                isPublished: isPublished ?? false,
                updatedAt: new Date(),
            })
            .where(eq(schema.articles.id, id));

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
        await db.delete(schema.articles).where(eq(schema.articles.id, id));
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
