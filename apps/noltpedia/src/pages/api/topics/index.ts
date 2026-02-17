import type { APIRoute } from "astro";
import { db, schema } from "../../../lib/db";
import { auth } from "../../../lib/auth";
import { desc } from "drizzle-orm";

export const GET: APIRoute = async ({ request }) => {
    // Check auth? Public for now or check session?
    // Topics are usually public for reading.
    const allTopics = await db.query.topics.findMany({
        orderBy: [desc(schema.topics.createdAt)],
    });

    return new Response(JSON.stringify(allTopics), {
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
    const { id, name, description, icon } = data;

    if (!id || !name) {
        return new Response("Missing required fields", { status: 400 });
    }

    try {
        await db.insert(schema.topics).values({
            id: id.toLowerCase().replace(/\s+/g, '-'),
            name,
            description,
            icon,
            isPublished: true, // Auto publish for now
        });
        return new Response(JSON.stringify({ success: true }), { status: 201 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
