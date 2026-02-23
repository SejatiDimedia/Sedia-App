import { useState, useEffect } from 'react';
import { db, type LocalProgress } from '@/lib/dexie';
import { authClient } from '@/lib/auth-client';

export function useBookmarks() {
    const { data: session } = authClient.useSession();
    const [bookmarks, setBookmarks] = useState<LocalProgress['bookmarks']>([]);

    // Storage ID logic: use user ID if logged in, otherwise 'guest'
    const storageId = session?.user?.id || 'guest';

    useEffect(() => {
        async function load() {
            const p = await db.localProgress.get(storageId);
            if (p && p.bookmarks) {
                setBookmarks(p.bookmarks);
            } else {
                setBookmarks([]);
            }
        }
        load();
    }, [storageId]);

    const toggleBookmark = async (surahNomor: number, ayahNomor: number, category: string = 'Umum') => {
        const p = await db.localProgress.get(storageId);
        const currentBookmarks = p?.bookmarks || [];

        const existsIndex = currentBookmarks.findIndex(b => b.surah === surahNomor && b.ayah === ayahNomor);

        if (existsIndex >= 0) {
            currentBookmarks.splice(existsIndex, 1);
        } else {
            currentBookmarks.push({ surah: surahNomor, ayah: ayahNomor, timestamp: Date.now(), category });
        }

        const newProgress: LocalProgress = {
            ...(p || { id: storageId, lastSurah: 1, lastAyah: 1, lastReadAt: Date.now(), bookmarks: [] }),
            bookmarks: currentBookmarks
        };

        await db.localProgress.put(newProgress);
        setBookmarks([...currentBookmarks]);

        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('jangji-progress-updated', { detail: newProgress }));
        }
    };

    const isBookmarked = (surahNomor: number, ayahNomor: number) => {
        return bookmarks.some(b => b.surah === surahNomor && b.ayah === ayahNomor);
    };

    return { bookmarks, toggleBookmark, isBookmarked };
}
