'use server';

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { userProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { LocalProgress } from "@/lib/dexie";

// Returns the newly updated progress or the existing one if server is newer
export async function syncProgress(clientProgress: LocalProgress | null) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    try {
        // 1. Fetch current server progress
        const existing = await db.select().from(userProgress).where(eq(userProgress.userId, userId)).limit(1);
        const serverTimestamp = existing.length > 0 ? existing[0].lastReadAt.getTime() : 0;

        // 2. If client has no progress, return server progress
        if (!clientProgress) {
            if (existing.length > 0) {
                return {
                    success: true,
                    data: {
                        id: userId,
                        lastSurah: existing[0].lastSurah,
                        lastAyah: existing[0].lastAyah,
                        lastReadAt: existing[0].lastReadAt.getTime(),
                        bookmarks: existing[0].bookmarks || [],
                    } as LocalProgress
                }
            }
            return { success: true, data: null };
        }

        // 3. Compare Timestamps (Hybrid Sync Logic)
        // If client is newer than server, update server
        if (clientProgress.lastReadAt > serverTimestamp) {
            const dbPayload = {
                userId,
                lastSurah: clientProgress.lastSurah,
                lastAyah: clientProgress.lastAyah,
                lastReadAt: new Date(clientProgress.lastReadAt),
                bookmarks: clientProgress.bookmarks || [],
            };

            if (existing.length > 0) {
                await db.update(userProgress).set(dbPayload).where(eq(userProgress.userId, userId));
            } else {
                await db.insert(userProgress).values(dbPayload);
            }

            return { success: true, data: clientProgress }; // Client wins
        }

        // 4. If server is newer, server wins
        if (existing.length > 0 && serverTimestamp > clientProgress.lastReadAt) {
            return {
                success: true,
                data: {
                    id: userId,
                    lastSurah: existing[0].lastSurah,
                    lastAyah: existing[0].lastAyah,
                    lastReadAt: existing[0].lastReadAt.getTime(),
                    bookmarks: existing[0].bookmarks || [],
                } as LocalProgress
            };
        }

        // Identical
        return { success: true, data: clientProgress };

    } catch (error) {
        console.error("Failed to sync progress:", error);
        return { success: false, error: "Internal Server Error" };
    }
}
