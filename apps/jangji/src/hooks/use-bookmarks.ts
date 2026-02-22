import { useState, useEffect } from 'react';
import { db, type LocalProgress } from '@/lib/dexie';

export function useBookmarks() {
    const [bookmarks, setBookmarks] = useState<LocalProgress['bookmarks']>([]);

    useEffect(() => {
        async function load() {
            const p = await db.localProgress.get('default');
            if (p && p.bookmarks) {
                setBookmarks(p.bookmarks);
            }
        }
        load();
    }, []);

    const toggleBookmark = async (surahNomor: number, ayahNomor: number) => {
        const p = await db.localProgress.get('default');
        const currentBookmarks = p?.bookmarks || [];

        const existsIndex = currentBookmarks.findIndex(b => b.surah === surahNomor && b.ayah === ayahNomor);

        if (existsIndex >= 0) {
            currentBookmarks.splice(existsIndex, 1);
        } else {
            currentBookmarks.push({ surah: surahNomor, ayah: ayahNomor, timestamp: Date.now() });
        }

        const newProgress: LocalProgress = {
            ...(p || { id: 'default', lastSurah: 1, lastAyah: 1, lastReadAt: Date.now() }),
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
