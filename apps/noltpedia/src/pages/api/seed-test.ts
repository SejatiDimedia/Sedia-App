import type { APIRoute } from "astro";
import { db, schema, eq } from "../../lib/db";
import { nanoid } from "nanoid";

export const GET: APIRoute = async () => {
    try {
        // Check if article with slug 'hello-world' exists
        const existing = await db.query.articles.findFirst({
            where: eq(schema.articles.slug, "hello-world"),
        });

        if (existing) {
            return new Response(JSON.stringify({ message: "Article already exists", article: existing }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Create test topic if needed
        let topicId = "general";
        const topic = await db.query.topics.findFirst({
            where: eq(schema.topics.id, "general"),
        });

        if (!topic) {
            await db.insert(schema.topics).values({
                id: topicId,
                name: "General",
                // slug: "general", // topics table has no slug, id is the slug
                icon: "📝",
                description: "General discussion",
            });
        } else {
            topicId = topic.id;
        }

        // Check for user
        let userId = "user_test";
        const user = await db.query.user.findFirst();

        if (!user) {
            // Create dummy user
            userId = nanoid();
            await db.insert(schema.user).values({
                id: userId,
                name: "Test User",
                email: "test@example.com",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        } else {
            userId = user.id;
        }

        // Create article
        const articleId = nanoid();
        await db.insert(schema.articles).values({
            id: articleId,
            title: "Hello World",
            slug: "hello-world",
            content: "This is a test article to verify the system.\n\n## Welcome to NoltPedia\n\nFeel free to comment below!",
            excerpt: "A test article for NoltPedia.",
            topicId: topicId,
            published: true,
            authorId: userId,
        });

        return new Response(JSON.stringify({ message: "Created article", id: articleId }), {
            status: 201,
        });

    } catch (e: any) {
        // If foreign key constraint fails, we probably need a user.
        // Let's create a dummy user? No, auth schema is separate.
        return new Response(e.message, { status: 500 });
    }
};
