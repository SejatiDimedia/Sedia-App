import { useState, useEffect } from 'react';
import { db, type LocalProgress } from '@/lib/dexie';
import { authClient } from '@/lib/auth-client';

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

    const saveProgress = async (surahNomor: number, ayahNomor: number) => {
        const newProgress: LocalProgress = {
            id: storageId,
            lastSurah: surahNomor,
            lastAyah: ayahNomor,
            lastReadAt: Date.now(),
            bookmarks: progress?.bookmarks || [],
        };

        await db.localProgress.put(newProgress);
        setProgress(newProgress);

        // Potentially trigger a background sync if online
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('jangji-progress-updated', { detail: newProgress }));
        }
    };

    return { progress, saveProgress };
}
