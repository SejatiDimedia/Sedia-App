import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { db, notification, eq, and, desc } from "@shared-db";

// GET: List notifications
export const GET: APIRoute = async ({ request }) => {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const notifications = await db
            .select()
            .from(notification)
            .where(eq(notification.userId, session.user.id))
            .orderBy(desc(notification.createdAt))
            .limit(20);

        return new Response(JSON.stringify({ notifications }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
};

// PATCH: Mark as read
export const PATCH: APIRoute = async ({ request }) => {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { id, all } = await request.json();

        if (all) {
            await db
                .update(notification)
                .set({ isRead: true })
                .where(eq(notification.userId, session.user.id));
        } else if (id) {
            await db
                .update(notification)
                .set({ isRead: true })
                .where(and(eq(notification.id, id), eq(notification.userId, session.user.id)));
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
};

// DELETE: Clear notifications
export const DELETE: APIRoute = async ({ request }) => {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        let id: string | undefined;
        let all: boolean | undefined;

        try {
            const body = await request.json();
            id = body.id;
            all = body.all;
        } catch (e) {
            // Empty body means clear all? Or specific flag?
            // Safer to require 'all: true' for safety, but if UI sends empty, we default to nothing?
            // Existing logic defaulted to "if (id) delete one, else delete all".
            // So if json fails, we might accidentally delete all if we proceed to else?
            // No, catching error returns 500 in original code.
            // Let's assume input 'all' is required for clear all.
        }

        if (id) {
            await db
                .delete(notification)
                .where(and(eq(notification.id, id), eq(notification.userId, session.user.id)));
        } else if (all) {
            await db
                .delete(notification)
                .where(eq(notification.userId, session.user.id));
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
};
