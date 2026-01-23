import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";
import { db, file, fileAccess, user, folder, folderAccess, eq, and, desc, sql } from "@shared-db";
import { getSignedUrl } from "../../../lib/storage";

interface SharedFileRecord {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    r2Key: string;
    sharedBy: string;
    sharedAt: Date;
    permission: string;
    ownerName: string | null;
    ownerEmail: string;
}

interface SharedFolderRecord {
    id: string;
    name: string;
    sharedBy: string;
    sharedAt: Date;
    permission: string;
    ownerName: string | null;
    ownerEmail: string;
}

// GET: List files shared with current user
export const GET: APIRoute = async ({ request, url }) => {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401 }
            );
        }

        const folderId = url.searchParams.get("folderId");

        // If folderId is provided, we list contents of that shared folder
        if (folderId) {
            // 1. Verify access to this folder
            const accessRecord = await db
                .select()
                .from(folderAccess)
                .where(and(
                    eq(folderAccess.folderId, folderId),
                    eq(folderAccess.sharedWithUserId, session.user.id)
                ))
                .limit(1);

            // Should also check if user is owner (though "shared with me" implies not owner, 
            // but for navigation consistency we might want to allow)
            // For now specific to shared view:
            if (accessRecord.length === 0) {
                return new Response(
                    JSON.stringify({ error: "Access denied or folder not found" }),
                    { status: 403 }
                );
            }

            // 2. Fetch Files in this folder (owned by anyone, usually folder owner)
            const files = await db
                .select({
                    id: file.id,
                    name: file.name,
                    mimeType: file.mimeType,
                    size: file.size,
                    r2Key: file.r2Key,
                    // Use folder specific info or fallback
                    sharedBy: user.id, // Placeholder, effectively owned by user
                    sharedAt: file.createdAt,
                    permission: sql`'view'`, // Inherit or default
                    ownerName: user.name,
                    ownerEmail: user.email,
                })
                .from(file)
                .innerJoin(user, eq(user.id, file.userId))
                .where(and(
                    eq(file.folderId, folderId),
                    eq(file.isDeleted, false)
                ))
                .orderBy(desc(file.createdAt));

            // 3. Fetch Subfolders
            const subfolders = await db
                .select({
                    id: folder.id,
                    name: folder.name,
                    sharedBy: user.id,
                    sharedAt: folder.createdAt,
                    permission: sql`'view'`,
                    ownerName: user.name,
                    ownerEmail: user.email,
                })
                .from(folder)
                .innerJoin(user, eq(user.id, folder.userId))
                .where(eq(folder.parentId, folderId))
                .orderBy(desc(folder.createdAt));

            // Add signed URLs
            const filesWithUrls = await Promise.all(
                files.map(async (f) => ({
                    ...f,
                    url: await getSignedUrl(f.r2Key),
                    // Fix permission to match folder access if possible
                    permission: accessRecord[0].permission
                }))
            );

            const foldersWithPerms = subfolders.map(f => ({
                ...f,
                permission: accessRecord[0].permission
            }));

            return new Response(
                JSON.stringify({
                    files: filesWithUrls,
                    folders: foldersWithPerms
                }),
                { status: 200 }
            );
        }

        // Default: List items explicitly shared with user (Roots)
        const sharedFiles = await db
            .select({
                id: file.id,
                name: file.name,
                mimeType: file.mimeType,
                size: file.size,
                r2Key: file.r2Key,
                sharedBy: fileAccess.sharedBy,
                sharedAt: fileAccess.sharedAt,
                permission: fileAccess.permission,
                ownerName: user.name,
                ownerEmail: user.email,
            })
            .from(fileAccess)
            .innerJoin(file, eq(file.id, fileAccess.fileId))
            .innerJoin(user, eq(user.id, file.userId))
            .where(
                and(
                    eq(fileAccess.sharedWithUserId, session.user.id),
                    eq(file.isDeleted, false)
                )
            )
            .orderBy(desc(fileAccess.sharedAt));

        // Get folders shared with current user
        const sharedFolders = await db
            .select({
                id: folder.id,
                name: folder.name,
                sharedBy: folderAccess.sharedBy,
                sharedAt: folderAccess.sharedAt,
                permission: folderAccess.permission,
                ownerName: user.name,
                ownerEmail: user.email,
            })
            .from(folderAccess)
            .innerJoin(folder, eq(folder.id, folderAccess.folderId))
            .innerJoin(user, eq(user.id, folder.userId))
            .where(eq(folderAccess.sharedWithUserId, session.user.id))
            .orderBy(desc(folderAccess.sharedAt));

        // Add signed URLs
        const filesWithUrls = await Promise.all(
            sharedFiles.map(async (f) => ({
                ...f,
                url: await getSignedUrl(f.r2Key),
            }))
        );

        return new Response(
            JSON.stringify({
                files: filesWithUrls,
                folders: sharedFolders
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("List shared files error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to list shared files" }),
            { status: 500 }
        );
    }
};
