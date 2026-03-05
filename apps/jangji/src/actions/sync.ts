'use server';

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { userKhatamEvent, userProgress } from "@/db/schema";
import { and, eq } from "drizzle-orm";
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

type LocalJuzCompletionEvent = {
    userId: string;
    juzNumber: number;
    completedAt: number;
};

type LocalManualKhatamEvent = {
    userId: string;
    completedAt: number;
    note?: string;
};

export async function syncKhatamHistory(
    localJuzEvents: LocalJuzCompletionEvent[],
    localManualEvents: LocalManualKhatamEvent[]
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    try {
        for (const event of localJuzEvents) {
            if (event.userId !== userId) continue;

            const existing = await db.select({ id: userKhatamEvent.id })
                .from(userKhatamEvent)
                .where(and(
                    eq(userKhatamEvent.userId, userId),
                    eq(userKhatamEvent.source, "juz"),
                    eq(userKhatamEvent.juzNumber, event.juzNumber),
                    eq(userKhatamEvent.completedAt, new Date(event.completedAt))
                ))
                .limit(1);

            if (existing.length === 0) {
                await db.insert(userKhatamEvent).values({
                    userId,
                    source: "juz",
                    juzNumber: event.juzNumber,
                    completedAt: new Date(event.completedAt),
                });
            }
        }

        for (const event of localManualEvents) {
            if (event.userId !== userId) continue;

            const existing = await db.select({ id: userKhatamEvent.id })
                .from(userKhatamEvent)
                .where(and(
                    eq(userKhatamEvent.userId, userId),
                    eq(userKhatamEvent.source, "manual"),
                    eq(userKhatamEvent.completedAt, new Date(event.completedAt)),
                    eq(userKhatamEvent.note, event.note || null)
                ))
                .limit(1);

            if (existing.length === 0) {
                await db.insert(userKhatamEvent).values({
                    userId,
                    source: "manual",
                    completedAt: new Date(event.completedAt),
                    note: event.note || null,
                });
            }
        }

        const allServerEvents = await db.select().from(userKhatamEvent).where(eq(userKhatamEvent.userId, userId));

        const juzEvents = allServerEvents
            .filter((event) => event.source === "juz" && event.juzNumber !== null)
            .map((event) => ({
                userId,
                juzNumber: event.juzNumber as number,
                completedAt: event.completedAt.getTime(),
            }));

        const manualEvents = allServerEvents
            .filter((event) => event.source === "manual")
            .map((event) => ({
                userId,
                completedAt: event.completedAt.getTime(),
                note: event.note || undefined,
            }));

        return { success: true, data: { juzEvents, manualEvents } };
    } catch (error) {
        console.error("Failed to sync khatam history:", error);
        return { success: false, error: "Internal Server Error" };
    }
}
