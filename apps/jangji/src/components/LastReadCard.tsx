'use client';

import { useProgress } from '@/hooks/use-progress';
import { useSurahs } from '@/hooks/use-quran-data';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';

export default function LastReadCard() {
    const { progress } = useProgress();
    const { surahs } = useSurahs();

    if (!progress || !progress.lastSurah) return null;

    const surah = surahs.find(s => s.nomor === progress.lastSurah);
    if (!surah) return null;

    return (
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/30 p-6 border border-primary/20 shadow-sm transition-all hover:shadow-md">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary opacity-80">Terakhir Dibaca</span>
                        <h3 className="text-xl font-bold text-foreground">
                            {surah.namaLatin} <span className="text-primary">: {progress.lastAyah}</span>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Terakhir dibaca {new Date(progress.lastReadAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <Link
                    href={`/surah/${progress.lastSurah}#ayah-${progress.lastAyah}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95"
                >
                    Lanjutkan Membaca
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            {/* Decorative Arabic Text Background */}
            <div className="absolute -right-8 -bottom-10 opacity-[0.03] pointer-events-none select-none">
                <span className="font-arabic text-[120px] leading-none">
                    {surah.nama}
                </span>
            </div>
        </div>
    );
}
