'use client';

import { useBookmarks } from '@/hooks/use-bookmarks';
import { useSurahs } from '@/hooks/use-quran-data';
import Link from 'next/link';

export default function BookmarkList() {
    const { bookmarks } = useBookmarks();
    const { surahs } = useSurahs();

    if (!bookmarks || bookmarks.length === 0) {
        return (
            <div className="rounded-xl border border-secondary/50 bg-secondary/10 p-6 text-center dark:border-secondary/20 dark:bg-white/5">
                <p className="text-sm text-muted-foreground">Belum ada ayat yang ditandai sebagai favorit.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {bookmarks.sort((a, b) => b.timestamp - a.timestamp).map((bookmark) => {
                const surah = surahs.find(s => s.nomor === bookmark.surah);
                if (!surah) return null;

                return (
                    <Link
                        key={`${bookmark.surah}-${bookmark.ayah}`}
                        href={`/surah/${bookmark.surah}#ayah-${bookmark.ayah}`}
                        className="flex items-center justify-between rounded-xl border border-secondary/50 bg-white p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md dark:border-secondary/10 dark:bg-white/5"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground">
                                    Surat {surah.namaLatin}
                                </h4>
                                <p className="text-sm text-muted-foreground">Ayat ke-{bookmark.ayah}</p>
                            </div>
                        </div>
                        <div className="hidden sm:block text-xs font-mono text-muted-foreground bg-secondary/30 px-2 py-1 rounded">
                            {new Date(bookmark.timestamp).toLocaleDateString('id-ID')}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
