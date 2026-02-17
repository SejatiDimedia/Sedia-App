import type { APIRoute } from "astro";
import { db, schema, eq, sql } from "../../lib/db";
import { auth } from "../../lib/auth";
import { nanoid } from "nanoid";

interface BulkImportPayload {
    topic?: {
        id: string;
        name: string;
        description?: string;
        icon?: string;
    };
    articles?: {
        slug: string;
        title: string;
        excerpt?: string;
        content: string;
        difficulty?: string;
    }[];
    path?: {
        title: string;
        slug: string;
        description?: string;
    };
}

interface ImportResult {
    topic: { created: boolean; skipped: boolean; id: string } | null;
    articles: {
        created: string[];
        skipped: string[];
        errors: { slug: string; error: string }[];
    };
    path: { created: boolean; id: string; stepsCount: number } | null;
}

export const POST: APIRoute = async ({ request }) => {
    // Auth check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    let payload: BulkImportPayload;
    try {
        payload = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const result: ImportResult = {
        topic: null,
        articles: { created: [], skipped: [], errors: [] },
        path: null,
    };

    // Map slug → generated article ID for path step linking
    const articleIdMap: Record<string, string> = {};

    try {
        // ──────────────────────────────────────
        // 1. Create or skip Topic
        // ──────────────────────────────────────
        if (payload.topic) {
            const topicId = payload.topic.id.toLowerCase().replace(/\s+/g, "-");
            const existing = await db.query.topics.findFirst({
                where: eq(schema.topics.id, topicId),
            });

            if (existing) {
                result.topic = { created: false, skipped: true, id: topicId };
            } else {
                await db.insert(schema.topics).values({
                    id: topicId,
                    name: payload.topic.name,
                    description: payload.topic.description || null,
                    icon: payload.topic.icon || null,
                    isPublished: true,
                });
                result.topic = { created: true, skipped: false, id: topicId };
            }
        }

        // ──────────────────────────────────────
        // 2. Create Articles
        // ──────────────────────────────────────
        if (payload.articles && payload.articles.length > 0) {
            const topicId = payload.topic
                ? payload.topic.id.toLowerCase().replace(/\s+/g, "-")
                : null;

            for (const article of payload.articles) {
                if (!article.slug || !article.title || !article.content) {
                    result.articles.errors.push({
                        slug: article.slug || "(missing)",
                        error: "Missing required fields: slug, title, content",
                    });
                    continue;
                }

                // Check if slug already exists
                const existing = await db.query.articles.findFirst({
                    where: eq(schema.articles.slug, article.slug),
                });

                if (existing) {
                    result.articles.skipped.push(article.slug);
                    articleIdMap[article.slug] = existing.id;
                    continue;
                }

                const articleId = nanoid();
                try {
                    await db.insert(schema.articles).values({
                        id: articleId,
                        slug: article.slug,
                        title: article.title,
                        excerpt: article.excerpt || null,
                        content: article.content,
                        topicId: topicId,
                        difficulty: article.difficulty || "beginner",
                        isPublished: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    result.articles.created.push(article.slug);
                    articleIdMap[article.slug] = articleId;
                } catch (e: any) {
                    result.articles.errors.push({
                        slug: article.slug,
                        error: e.message,
                    });
                }
            }
        }

        // ──────────────────────────────────────
        // 3. Create Path + Steps
        // ──────────────────────────────────────
        if (payload.path && payload.articles && payload.articles.length > 0) {
            // Check if path slug already exists
            const existingPath = await db.query.paths.findFirst({
                where: eq(schema.paths.slug, payload.path.slug),
            });

            if (existingPath) {
                result.path = { created: false, id: existingPath.id, stepsCount: 0 };
            } else {
                const pathId = nanoid();
                await db.insert(schema.paths).values({
                    id: pathId,
                    title: payload.path.title,
                    description: payload.path.description || null,
                    slug: payload.path.slug,
                    isPublished: true,
                });

                // Create path steps in article order
                let stepsCreated = 0;
                for (let i = 0; i < payload.articles.length; i++) {
                    const slug = payload.articles[i].slug;
                    const articleId = articleIdMap[slug];
                    if (articleId) {
                        await db.insert(schema.pathSteps).values({
                            id: nanoid(),
                            pathId,
                            articleId,
                            stepOrder: i + 1,
                        });
                        stepsCreated++;
                    }
                }

                result.path = { created: true, id: pathId, stepsCount: stepsCreated };
            }
        }

        return new Response(JSON.stringify(result), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (e: any) {
        return new Response(
            JSON.stringify({ error: e.message, partialResult: result }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
};
