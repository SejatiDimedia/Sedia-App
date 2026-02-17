import type { APIRoute } from "astro";
import { db, schema, eq, desc } from "../../../lib/db";
import { auth } from "../../../lib/auth";
import { nanoid } from "nanoid";

export const GET: APIRoute = async ({ request }) => {
    const terms = await db.query.glossary.findMany({
        orderBy: (glossary, { desc }) => [desc(glossary.createdAt)],
    });
    return new Response(JSON.stringify(terms));
};

export const POST: APIRoute = async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });

    const body = await request.json();
    const { term, definition, relatedArticleId } = body;

    if (!term || !definition) {
        return new Response("Missing required fields", { status: 400 });
    }

    const id = nanoid();
    await db.insert(schema.glossary).values({
        id,
        term,
        definition,
        relatedArticleId: relatedArticleId || null,
    });

    return new Response(JSON.stringify({ id, term }), { status: 201 });
};
