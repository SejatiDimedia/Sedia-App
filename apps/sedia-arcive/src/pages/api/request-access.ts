import type { APIRoute } from "astro";
import { auth } from "../../lib/auth";
import { db, notification, appPermission, user, eq, and } from "@shared-db";
import { sendEmail } from "../../lib/email";
import { APP_ID } from "../../lib/permissions";

export const POST: APIRoute = async ({ request }) => {
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

        const userId = session.user.id;
        const userEmail = session.user.email;
        const userName = session.user.name;

        // Check current permission
        const currentPerm = await db
            .select()
            .from(appPermission)
            .where(and(eq(appPermission.userId, userId), eq(appPermission.appId, APP_ID)))
            .limit(1);

        if (currentPerm.length > 0 && currentPerm[0].uploadEnabled) {
            return new Response(JSON.stringify({ message: "You already have upload access." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Find all admins for this app
        // We look for users who have 'admin' role in appPermission for this APP_ID
        const admins = await db
            .select({
                userId: appPermission.userId,
                email: user.email,
                name: user.name,
            })
            .from(appPermission)
            .innerJoin(user, eq(appPermission.userId, user.id))
            .where(
                and(
                    eq(appPermission.appId, APP_ID),
                    eq(appPermission.role, "admin")
                )
            );

        if (admins.length === 0) {
            console.warn("No admins found for Sedia Arcive to notify.");
            // We still return success to the user so they don't feel it failed, 
            // but maybe log it for sysadmin.
        }

        const notificationsToInsert = [];
        const emailPromises = [];

        for (const admin of admins) {
            // 1. Prepare In-App Notification
            notificationsToInsert.push({
                userId: admin.userId,
                type: 'system', // or could add a specific type like 'access_request'
                title: 'Request Upload Access',
                message: `User ${userName} (${userEmail}) requested upload access.`,
                link: `/dashboard/admin?highlight=${userId}`, // Link to admin user management
                isRead: false,
            });

            // 2. Prepare Email
            const emailHtml = `
                <div style="font-family: sans-serif; color: #333;">
                    <h2>Access Request</h2>
                    <p>Hello ${admin.name},</p>
                    <p><strong>${userName}</strong> (${userEmail}) has requested upload access for Sedia Arcive.</p>
                    <p>Please review their account in the admin dashboard.</p>
                    <a href="${new URL(request.url).origin}/dashboard/admin?highlight=${userId}" style="display: inline-block; padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px;">Go to Admin Dashboard</a>
                </div>
            `;

            emailPromises.push(
                sendEmail({
                    to: admin.email,
                    subject: `[Sedia Arcive] Access Request from ${userName}`,
                    html: emailHtml,
                })
            );
        }

        // Execute DB inserts
        if (notificationsToInsert.length > 0) {
            await db.insert(notification).values(notificationsToInsert);
        }

        // Send Emails (don't await strictly if we want faster response, but better to await for reliability in this context)
        await Promise.allSettled(emailPromises);

        return new Response(JSON.stringify({ success: true, message: "Request sent to admins." }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Request access error:", error);
        return new Response(JSON.stringify({ error: "Failed to process request." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
