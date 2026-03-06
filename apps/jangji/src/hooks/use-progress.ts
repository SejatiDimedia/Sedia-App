import { useState, useEffect, useCallback } from 'react';
import { db, type LocalProgress } from '@/lib/dexie';
import { authClient } from '@/lib/auth-client';

function getLocalDateKey(timestamp = Date.now()): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function useProgress() {
    const { data: session } = authClient.useSession();
    const [progress, setProgress] = useState<LocalProgress | null>(null);

    // Storage ID logic: use user ID if logged in, otherwise 'guest'
    const storageId = session?.user?.id || 'guest';

    // Load progress on mount or session change
    useEffect(() => {
        async function load() {
            const p = await db.localProgress.get(storageId);
            if (p) {
                setProgress(p);
            } else {
                setProgress(null);
            }
        }
        load();
    }, [storageId]);

    const saveProgress = useCallback(async (surahNomor: number, ayahNomor: number) => {
        const now = Date.now();
        const today = getLocalDateKey(now);
        const ayahKey = `${surahNomor}:${ayahNomor}`;
        const newProgress: LocalProgress = {
            id: storageId,
            lastSurah: surahNomor,
            lastAyah: ayahNomor,
            lastReadAt: now,
            bookmarks: progress?.bookmarks || [],
        };

        await db.localProgress.put(newProgress);

        // Update reading history
        const history = await db.readingHistory.where('[userId+date]').equals([storageId, today]).first();
        if (history) {
            const existingKeys = new Set(history.readAyahKeys || []);
            const isNewAyah = !existingKeys.has(ayahKey);
            if (isNewAyah) existingKeys.add(ayahKey);

            await db.readingHistory.update(history.id!, {
                ayahCount: isNewAyah ? history.ayahCount + 1 : history.ayahCount,
                dailyTapCount: (history.dailyTapCount || history.ayahCount) + 1,
                surahsRead: Array.from(new Set([...history.surahsRead, surahNomor])),
                readAyahKeys: Array.from(existingKeys),
            });
        } else {
            await db.readingHistory.add({
                userId: storageId,
                date: today,
                ayahCount: 1,
                dailyTapCount: 1,
                surahsRead: [surahNomor],
                readAyahKeys: [ayahKey],
            });
        }

        setProgress(newProgress);

        // Potentially trigger a background sync if online
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('jangji-progress-updated', { detail: newProgress }));
        }
    }, [progress?.bookmarks, storageId]);

    return { progress, saveProgress };
}
