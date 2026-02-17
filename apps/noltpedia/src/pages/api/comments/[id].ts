import type { APIRoute } from "astro";
import { db, schema, eq, and } from "../../../lib/db";
import { auth } from "../../../lib/auth";
// import { eq, and } from "drizzle-orm"; // Removed

export const DELETE: APIRoute = async ({ request, params }) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { id } = params;
    if (!id) return new Response("Missing ID", { status: 400 });

    try {
        // Check ownership or admin role
        // For efficiency we can just try to delete where id=id AND (userId=me OR me is admin)
        // But extracting permission logic often better.

        // 1. Get the comment to check owner
        const comment = await db.select().from(schema.comments).where(eq(schema.comments.id, id)).limit(1);

        if (!comment.length) {
            return new Response("Not found", { status: 404 });
        }

        const isOwner = comment[0].userId === session.user.id;

        // Check Admin Role
        const appPerms = await db.query.appPermission.findFirst({
            where: and(
                eq(schema.appPermission.userId, session.user.id),
                eq(schema.appPermission.appId, "noltpedia")
            )
        });
        const isAdmin = appPerms?.role === "admin";

        if (!isOwner && !isAdmin) {
            return new Response("Forbidden", { status: 403 });
        }

        await db.delete(schema.comments).where(eq(schema.comments.id, id));

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
};
