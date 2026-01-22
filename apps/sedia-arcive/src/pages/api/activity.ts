import type { APIRoute } from "astro";
import { auth } from "../../lib/auth";
import { getUserActivities } from "../../lib/activity";

export const GET: APIRoute = async ({ request, url }) => {
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

        const limit = parseInt(url.searchParams.get("limit") || "20");
        const activities = await getUserActivities(session.user.id, Math.min(limit, 50));

        // Parse metadata for each activity
        const formattedActivities = activities.map((activity) => ({
            ...activity,
            metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
        }));

        return new Response(JSON.stringify({ activities: formattedActivities }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Activity list error:", error);
        return new Response(JSON.stringify({ error: "Failed to get activities" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
