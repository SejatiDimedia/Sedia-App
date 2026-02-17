import type { APIRoute } from "astro";
import { db, schema } from "../../../lib/db";
import { auth } from "../../../lib/auth";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export const GET: APIRoute = async ({ request }) => {
    // Fetch all articles
    const allArticles = await db.query.articles.findMany({
        orderBy: [desc(schema.articles.createdAt)],
        with: {
            topic: true,
        }
    });

    return new Response(JSON.stringify(allArticles), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

export const POST: APIRoute = async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    const data = await request.json();
    const { title, slug, content, topicId, isPublished } = data;

    if (!title || !slug || !content || !topicId) {
        return new Response("Missing required fields", { status: 400 });
    }

    // Check slug uniqueness
    const existing = await db.query.articles.findFirst({
        where: eq(schema.articles.slug, slug),
    });

    if (existing) {
        return new Response(JSON.stringify({ error: "Slug already exists" }), { status: 409 });
    }

    try {
        await db.insert(schema.articles).values({
            id: nanoid(),
            title,
            slug,
            content,
            topicId,
            isPublished: isPublished || false,
            authorId: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return new Response(JSON.stringify({ success: true }), { status: 201 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
