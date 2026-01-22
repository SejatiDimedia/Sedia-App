import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { db, folder, eq, and, desc } from "@shared-db";
import { nanoid } from "nanoid";
import { logActivity } from "../../../lib/activity";

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

        const url = new URL(request.url);
        const parentId = url.searchParams.get("parentId");

        // Build query conditions
        const conditions = [eq(folder.userId, session.user.id)];

        if (parentId) {
            conditions.push(eq(folder.parentId, parentId));
        } else {
            // Root level folders (parentId is null)
            // Note: Drizzle doesn't have isNull in the same way, we use raw SQL or handle differently
            // For simplicity, we'll fetch all and filter, or use a workaround
        }

        const folders = await db
            .select()
            .from(folder)
            .where(and(...conditions))
            .orderBy(desc(folder.createdAt));

        // Filter for root folders if no parentId specified
        const filteredFolders = parentId
            ? folders
            : folders.filter(f => f.parentId === null);

        return new Response(JSON.stringify({ folders: filteredFolders }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("List folders error:", error);
        return new Response(JSON.stringify({ error: "Failed to list folders" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

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
        const { name, parentId } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return new Response(JSON.stringify({ error: "Folder name is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Verify parent folder exists and belongs to user (if parentId provided)
        if (parentId) {
            const parentFolder = await db
                .select()
                .from(folder)
                .where(and(eq(folder.id, parentId), eq(folder.userId, session.user.id)))
                .limit(1);

            if (parentFolder.length === 0) {
                return new Response(JSON.stringify({ error: "Parent folder not found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                });
            }
        }

        const newFolder = {
            id: nanoid(),
            name: name.trim(),
            parentId: parentId || null,
            userId: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.insert(folder).values(newFolder);

        // Log activity
        await logActivity({
            userId: session.user.id,
            action: "create_folder",
            targetType: "folder",
            targetId: newFolder.id,
            targetName: newFolder.name,
            metadata: { parentId: parentId || null },
        });

        return new Response(JSON.stringify({ folder: newFolder }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Create folder error:", error);
        return new Response(JSON.stringify({ error: "Failed to create folder" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

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
        const { folderId } = body;

        if (!folderId) {
            return new Response(JSON.stringify({ error: "Folder ID is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Verify folder exists and belongs to user
        const existingFolder = await db
            .select()
            .from(folder)
            .where(and(eq(folder.id, folderId), eq(folder.userId, session.user.id)))
            .limit(1);

        if (existingFolder.length === 0) {
            return new Response(JSON.stringify({ error: "Folder not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Delete folder (files inside will have folderId set to null due to onDelete: "set null")
        await db.delete(folder).where(eq(folder.id, folderId));

        // Log activity
        await logActivity({
            userId: session.user.id,
            action: "delete_folder",
            targetType: "folder",
            targetId: folderId,
            targetName: existingFolder[0].name,
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Delete folder error:", error);
        return new Response(JSON.stringify({ error: "Failed to delete folder" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
// PUT: Move a folder
export const PUT: APIRoute = async ({ request }) => {
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
        const { folderId, parentId } = body;

        if (!folderId) {
            return new Response(JSON.stringify({ error: "Folder ID is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 1. Verify source folder exists and belongs to user
        const sourceFolder = await db
            .select()
            .from(folder)
            .where(and(eq(folder.id, folderId), eq(folder.userId, session.user.id)))
            .limit(1);

        if (sourceFolder.length === 0) {
            return new Response(JSON.stringify({ error: "Folder not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 2. Prevent moving into itself
        if (folderId === parentId) {
            return new Response(JSON.stringify({ error: "Cannot move folder into itself" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 3. Prevent moving into its own subfolder (Circular dependency check)
        if (parentId) {
            // Check if parentId is actually a child of folderId
            // This requires traversing up from parentId to check if we hit folderId
            let currentParentId: string | null = parentId;
            let loopDetected = false;

            // Safety limit for depth
            let depth = 0;
            const MAX_DEPTH = 50;

            while (currentParentId && depth < MAX_DEPTH) {
                if (currentParentId === folderId) {
                    loopDetected = true;
                    break;
                }

                // Get parent of currentParent
                const parentFolder: any[] = await db
                    .select({ parentId: folder.parentId })
                    .from(folder)
                    .where(eq(folder.id, currentParentId))
                    .limit(1);

                if (parentFolder.length === 0) break;
                currentParentId = parentFolder[0].parentId;
                depth++;
            }

            if (loopDetected) {
                return new Response(JSON.stringify({ error: "Cannot move folder into its own subfolder" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }
        }

        // 4. Update folder's parentId
        await db
            .update(folder)
            .set({
                parentId: parentId || null,
                updatedAt: new Date()
            })
            .where(eq(folder.id, folderId));

        // Log activity
        await logActivity({
            userId: session.user.id,
            action: "move",
            targetType: "folder",
            targetId: folderId,
            targetName: sourceFolder[0].name,
            metadata: {
                fromParentId: sourceFolder[0].parentId,
                toParentId: parentId || null,
            },
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Move folder error:", error);
        return new Response(JSON.stringify({ error: "Failed to move folder" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
