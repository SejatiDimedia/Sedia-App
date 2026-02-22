'use client';

import { useProgress } from '@/hooks/use-progress';
import { useSurahs } from '@/hooks/use-quran-data';
import Link from '@/components/OfflineLink';
import { BookOpen, ArrowRight, LayoutGrid, List } from 'lucide-react';
import { getJuzNumber } from '@/lib/quran-utils';

export default function LastReadCard() {
    const { progress } = useProgress();
    const { surahs } = useSurahs();

    if (!progress || !progress.lastSurah) return null;

    const surah = surahs.find(s => s.nomor === progress.lastSurah);
    if (!surah) return null;

    const juzId = getJuzNumber(progress.lastSurah, progress.lastAyah);

    return (
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/30 p-6 border border-primary/20 shadow-sm transition-all hover:shadow-md">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg ring-4 ring-primary/10">
                        <BookOpen className="h-7 w-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">Terakhir Dibaca</span>
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">
                            {surah.namaLatin} <span className="text-primary text-xl">: {progress.lastAyah}</span>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Diperbarui {new Date(progress.lastReadAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href={`/surah/${progress.lastSurah}#ayah-${progress.lastAyah}`}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                    >
                        <List className="h-4 w-4" />
                        Lanjutkan Surah
                    </Link>
                    <Link
                        href={`/juz/${juzId}#ayah-${progress.lastSurah}-${progress.lastAyah}`}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-primary shadow-sm ring-1 ring-primary/10 transition-all hover:bg-secondary/80 hover:scale-[1.01] active:scale-95 whitespace-nowrap"
                    >
                        <LayoutGrid className="h-4 w-4" />
                        Lanjutkan Juz
                    </Link>
                </div>
            </div>

            {/* Decorative Arabic Text Background */}
            <div className="absolute -left-8 -bottom-10 opacity-[0.08] dark:opacity-[0.1] pointer-events-none select-none group-hover:opacity-[0.12] transition-opacity">
                <span className="font-arabic text-[140px] leading-none text-primary">
                    {surah.nama}
                </span>
            </div>
        </div>
    );
}
