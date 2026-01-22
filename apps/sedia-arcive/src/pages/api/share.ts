import type { APIRoute } from "astro";
import { auth } from "../../lib/auth";
import { db, shareLink, file, folder, eq, and } from "@shared-db";
import { nanoid } from "nanoid";

// Create a share link
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

        const body = await request.json();
        const { targetType, targetId, password, expiresIn, allowDownload } = body;

        // Validate target type
        if (!["file", "folder"].includes(targetType)) {
            return new Response(JSON.stringify({ error: "Invalid target type" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Verify ownership
        if (targetType === "file") {
            const fileRecord = await db
                .select()
                .from(file)
                .where(and(eq(file.id, targetId), eq(file.userId, session.user.id)))
                .limit(1);

            if (fileRecord.length === 0) {
                return new Response(JSON.stringify({ error: "File not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                });
            }
        } else {
            const folderRecord = await db
                .select()
                .from(folder)
                .where(and(eq(folder.id, targetId), eq(folder.userId, session.user.id)))
                .limit(1);

            if (folderRecord.length === 0) {
                return new Response(JSON.stringify({ error: "Folder not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                });
            }
        }

        // Generate token
        const token = nanoid(16);

        // Calculate expiration
        let expiresAt: Date | null = null;
        if (expiresIn) {
            expiresAt = new Date();
            switch (expiresIn) {
                case "1h":
                    expiresAt.setHours(expiresAt.getHours() + 1);
                    break;
                case "24h":
                    expiresAt.setHours(expiresAt.getHours() + 24);
                    break;
                case "7d":
                    expiresAt.setDate(expiresAt.getDate() + 7);
                    break;
                case "30d":
                    expiresAt.setDate(expiresAt.getDate() + 30);
                    break;
                default:
                    expiresAt = null;
            }
        }

        // Create share link
        const newShareLink = await db
            .insert(shareLink)
            .values({
                token,
                targetType,
                targetId,
                password: password || null,
                expiresAt,
                allowDownload: allowDownload ? "true" : "false",
                createdBy: session.user.id,
            })
            .returning();

        // Generate public URL
        const baseUrl = new URL(request.url).origin;
        const shareUrl = `${baseUrl}/share/${token}`;

        return new Response(
            JSON.stringify({
                success: true,
                shareLink: {
                    ...newShareLink[0],
                    url: shareUrl,
                },
            }),
            {
                status: 201,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Create share link error:", error);
        return new Response(JSON.stringify({ error: "Failed to create share link" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

// Delete a share link
export const DELETE: APIRoute = async ({ request }) => {
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

        const body = await request.json();
        const { shareId } = body;

        if (!shareId) {
            return new Response(JSON.stringify({ error: "Share ID is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Verify ownership
        const existing = await db
            .select()
            .from(shareLink)
            .where(and(eq(shareLink.id, shareId), eq(shareLink.createdBy, session.user.id)))
            .limit(1);

        if (existing.length === 0) {
            return new Response(JSON.stringify({ error: "Share link not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        await db.delete(shareLink).where(eq(shareLink.id, shareId));

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Delete share link error:", error);
        return new Response(JSON.stringify({ error: "Failed to delete share link" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

// Get share links for a target
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

        const targetType = url.searchParams.get("targetType");
        const targetId = url.searchParams.get("targetId");

        if (!targetType || !targetId) {
            return new Response(JSON.stringify({ error: "Missing parameters" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const links = await db
            .select()
            .from(shareLink)
            .where(
                and(
                    eq(shareLink.targetType, targetType),
                    eq(shareLink.targetId, targetId),
                    eq(shareLink.createdBy, session.user.id)
                )
            );

        const baseUrl = new URL(request.url).origin;
        const linksWithUrls = links.map((link) => ({
            ...link,
            url: `${baseUrl}/share/${link.token}`,
        }));

        return new Response(JSON.stringify({ shareLinks: linksWithUrls }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Get share links error:", error);
        return new Response(JSON.stringify({ error: "Failed to get share links" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
