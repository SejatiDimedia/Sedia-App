import type { APIRoute } from "astro";
import { db, schema } from "../../../lib/db";
import { ilike, or, desc } from "drizzle-orm";

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    if (!query || query.length < 2) {
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }

    const searchPattern = `%${query}%`;

    try {
        // Parallel search
        const [articles, topics] = await Promise.all([
            db.select({
                id: schema.articles.id,
                title: schema.articles.title,
                slug: schema.articles.slug,
                type: schema.articles.isPublished // Just a hack to return static string in SQL if widely supported, but let's map in JS
            })
                .from(schema.articles)
                .where(
                    or(
                        ilike(schema.articles.title, searchPattern),
                        ilike(schema.articles.content, searchPattern)
                    )
                )
                .limit(5),

            db.select({
                id: schema.topics.id,
                name: schema.topics.name,
                description: schema.topics.description,
            })
                .from(schema.topics)
                .where(ilike(schema.topics.name, searchPattern))
                .limit(3)
        ]);

        // Transform to unified format
        const results = [
            ...topics.map(t => ({
                id: t.id,
                title: t.name,
                subtitle: "Topic",
                url: `/topics/${t.id}`,
                type: "topic"
            })),
            ...articles.map(a => ({
                id: a.id,
                title: a.title,
                subtitle: "Article",
                url: `/articles/${a.slug}`, // Public URL structure
                type: "article"
            }))
        ];

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};
