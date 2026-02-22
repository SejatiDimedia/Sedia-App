import { useState, useEffect } from 'react';
import { db, type LocalProgress } from '@/lib/dexie';

export function useProgress() {
    const [progress, setProgress] = useState<LocalProgress | null>(null);

    // Load progress on mount
    useEffect(() => {
        async function load() {
            const p = await db.localProgress.get('default');
            if (p) {
                setProgress(p);
            }
        }
        load();
    }, []);

    const saveProgress = async (surahNomor: number, ayahNomor: number) => {
        const newProgress: LocalProgress = {
            id: 'default',
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
