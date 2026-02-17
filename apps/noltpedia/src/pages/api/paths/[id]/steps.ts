import type { APIRoute } from "astro";
import { db, pathSteps, eq, asc } from "../../../../lib/db";
import { nanoid } from "nanoid";

export const GET: APIRoute = async ({ params }) => {
    try {
        const { id: pathId } = params;
        if (!pathId) return new Response(JSON.stringify({ error: "Path ID required" }), { status: 400 });

        const steps = await db.query.pathSteps.findMany({
            where: eq(pathSteps.pathId, pathId),
            orderBy: [asc(pathSteps.stepOrder)],
            with: {
                article: true,
            },
        });

        return new Response(JSON.stringify(steps), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Failed to fetch path steps" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

export const POST: APIRoute = async ({ params, request }) => {
    try {
        const { id: pathId } = params;
        if (!pathId) return new Response(JSON.stringify({ error: "Path ID required" }), { status: 400 });

        const body = await request.json();
        const { steps } = body; // Array of { articleId, stepOrder }

        // Transaction not supported in neon-http driver, executing sequentially
        await db.delete(pathSteps).where(eq(pathSteps.pathId, pathId));

        if (steps && steps.length > 0) {
            for (const step of steps) {
                await db.insert(pathSteps).values({
                    id: nanoid(),
                    pathId,
                    articleId: step.articleId,
                    stepOrder: step.stepOrder,
                });
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Failed to update path steps" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
