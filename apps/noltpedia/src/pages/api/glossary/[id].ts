import type { APIRoute } from "astro";
import { db, schema, eq } from "../../../lib/db";
import { auth } from "../../../lib/auth";

export const PUT: APIRoute = async ({ params, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });

    const { id } = params;
    if (!id) return new Response("Missing ID", { status: 400 });

    const body = await request.json();
    const { term, definition, relatedArticleId } = body;

    await db.update(schema.glossary)
        .set({ term, definition, relatedArticleId: relatedArticleId || null })
        .where(eq(schema.glossary.id, id));

    return new Response(JSON.stringify({ success: true }));
};

export const DELETE: APIRoute = async ({ params, request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });

    const { id } = params;
    if (!id) return new Response("Missing ID", { status: 400 });

    await db.delete(schema.glossary).where(eq(schema.glossary.id, id));

    return new Response(JSON.stringify({ success: true }));
};
