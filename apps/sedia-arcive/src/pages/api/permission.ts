import type { APIRoute } from "astro";
import { auth } from "../../lib/auth";
import { getUserPermission } from "../../lib/permissions";

export const GET: APIRoute = async ({ request }) => {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const permission = await getUserPermission(session.user.id);

        return new Response(JSON.stringify({
            id: permission.id,
            role: permission.role,
            uploadEnabled: permission.uploadEnabled,
            storageLimit: permission.storageLimit,
            storageUsed: permission.storageUsed,
            storageRemaining: permission.storageLimit - permission.storageUsed,
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Permission error:", error);
        return new Response(JSON.stringify({ error: "Failed to get permissions" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
