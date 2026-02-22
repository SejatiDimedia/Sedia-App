'use client';

import { useBookmarks } from '@/hooks/use-bookmarks';
import { useSurahs } from '@/hooks/use-quran-data';
import Link from '@/components/OfflineLink';
import { Star, ArrowRight, BookOpen } from 'lucide-react';

export default function BookmarkList() {
    const { bookmarks } = useBookmarks();
    const { surahs } = useSurahs();

    if (!bookmarks || bookmarks.length === 0) {
        return (
            <div className="rounded-2xl border-2 border-dashed border-secondary/30 bg-secondary/5 p-12 text-center transition-all hover:bg-secondary/10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20 text-muted-foreground">
                    <Star className="h-8 w-8 opacity-40" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Belum ada favorit</h3>
                <p className="mx-auto max-w-[200px] text-sm text-muted-foreground">
                    Klik ikon bintang di surat untuk menyimpannya di sini.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bookmarks.sort((a, b) => b.timestamp - a.timestamp).map((bookmark) => {
                const surah = surahs.find(s => s.nomor === bookmark.surah);
                if (!surah) return null;

                return (
                    <Link
                        key={`${bookmark.surah}-${bookmark.ayah}`}
                        href={`/surah/${bookmark.surah}#ayah-${bookmark.ayah}`}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-secondary/50 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl dark:border-secondary/10 dark:bg-white/5 dark:hover:bg-white/[0.08]"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                                    <Star className="h-6 w-6 fill-current" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-foreground">
                                        {surah.namaLatin}
                                    </h4>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>Ayat {bookmark.ayah}</span>
                                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30"></span>
                                        <span className="text-xs">{surah.arti}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="font-arabic text-xl opacity-20 transition-opacity group-hover:opacity-100 dark:text-white">
                                {surah.nama}
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                {new Date(bookmark.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                            <div className="flex items-center gap-1 text-xs font-bold text-primary opacity-0 transition-all group-hover:opacity-100">
                                Baca Sekarang <ArrowRight className="h-3 w-3" />
                            </div>
                        </div>

                        {/* Decoration */}
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10"></div>
                    </Link>
                );
            })}
        </div>
    );
}

