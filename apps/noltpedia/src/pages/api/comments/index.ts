import type { APIRoute } from "astro";
import { db, schema, eq, desc } from "../../../lib/db";
import { auth } from "../../../lib/auth";
import { nanoid } from "nanoid";
// import { eq, desc } from "drizzle-orm"; // Removed

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const articleId = url.searchParams.get("articleId");

    if (!articleId) {
        return new Response("Missing articleId", { status: 400 });
    }

    try {
        const comments = await db
            .select({
                id: schema.comments.id,
                content: schema.comments.content,
                createdAt: schema.comments.createdAt,
                user: {
                    id: schema.user.id,
                    name: schema.user.name,
                    image: schema.user.image,
                },
                userId: schema.comments.userId
            })
            .from(schema.comments)
            .leftJoin(schema.user, eq(schema.comments.userId, schema.user.id))
            .where(eq(schema.comments.articleId, articleId))
            .orderBy(desc(schema.comments.createdAt));

        return new Response(JSON.stringify(comments), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
};

export const POST: APIRoute = async ({ request }) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const { articleId, content } = body;

        if (!articleId || !content) {
            return new Response("Missing fields", { status: 400 });
        }

        await db.insert(schema.comments).values({
            id: nanoid(),
            content,
            articleId,
            userId: session.user.id,
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
};
