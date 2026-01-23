import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { db, notification, eq, and, sql } from "@shared-db";

// GET: Count unread notifications
export const GET: APIRoute = async ({ request }) => {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(notification)
            .where(and(
                eq(notification.userId, session.user.id),
                eq(notification.isRead, false)
            ));

        return new Response(JSON.stringify({ count: result[0].count }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
};
