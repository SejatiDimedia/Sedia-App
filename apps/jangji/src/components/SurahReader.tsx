'use client';

import { useSurahDetail } from '@/hooks/use-quran-data';
import { useProgress } from '@/hooks/use-progress';
import { useBookmarks } from '@/hooks/use-bookmarks';
import AudioPlayer from '@/components/AudioPlayer';
import AyahAudioPlayer from '@/components/AyahAudioPlayer';
import ThemeToggle from '@/components/ThemeToggle';
import { UserAuthMenu } from '@/components/auth/UserAuthMenu';
import { getJuzNumber } from '@/lib/quran-utils';
import Link from 'next/link';
import { useEffect } from 'react';
import { BookmarkCheck, Bookmark } from 'lucide-react';

export default function SurahReader({ nomor }: { nomor: number }) {
    const { surah, loading, error } = useSurahDetail(nomor);
    const { progress, saveProgress } = useProgress();
    const { toggleBookmark, isBookmarked } = useBookmarks();

    // Auto-scroll to hash if it exists after content is loaded
    useEffect(() => {
        const handleScroll = () => {
            if (!loading && surah && typeof window !== 'undefined') {
                const hash = window.location.hash;
                if (hash) {
                    const id = hash.replace('#', '');
                    setTimeout(() => {
                        const element = document.getElementById(id);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });

                            // Visual highlight effect
                            element.classList.add('highlight-ayah');
                            setTimeout(() => {
                                element.classList.remove('highlight-ayah');
                            }, 3000);
                        }
                    }, 500);
                }
            }
        };

        handleScroll();
        window.addEventListener('hashchange', handleScroll);
        return () => window.removeEventListener('hashchange', handleScroll);
    }, [loading, surah]);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-secondary-foreground animate-pulse">Memuat Surat...</p>
            </div>
        );
    }

    if (error || !surah) {
        return (
            <div className="p-8 text-center text-red-500">
                <p>Gagal memuat data surat: {error?.message || 'Data tidak ditemukan'}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 rounded bg-primary px-4 py-2 text-white"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl pb-24">
            {/* Header */}
            <div className="mb-8 rounded-2xl bg-gradient-to-br from-primary to-[#2E7D32] p-6 text-center text-white shadow-lg">
                <div className="flex justify-center gap-2 text-xs font-bold uppercase tracking-widest opacity-80 mb-2">
                    <span>{surah.tempatTurun}</span>
                    <span>•</span>
                    <span>{surah.jumlahAyat} Ayat</span>
                    <span>•</span>
                    <span>Juz {getJuzNumber(surah.nomor, 1)}</span>
                </div>
                <h1 className="font-arabic text-4xl font-bold mb-2">{surah.nama}</h1>
                <h2 className="text-2xl font-bold tracking-tight mb-1">{surah.namaLatin}</h2>
                <p className="text-white/90 text-sm italic">{surah.arti}</p>
                {/* Full Surah Audio (Mishary Rashid Alafasy) */}
                {surah.audioFull && surah.audioFull['05'] && (
                    <AudioPlayer audioUrl={surah.audioFull['05']} />
                )}
            </div>

            {/* Bismillah (except Surah Al-Fatihah and At-Tawbah) */}
            {surah.nomor !== 1 && surah.nomor !== 9 && (
                <div className="mb-10 text-center font-arabic text-3xl leading-loose tracking-wide text-foreground">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
            )}

            {/* Verses List */}
            <div className="space-y-8">
                {surah.ayat.map((ayah) => {
                    const isLastRead = progress?.lastSurah === surah.nomor && progress?.lastAyah === ayah.nomorAyat;
                    const isFavorited = isBookmarked(surah.nomor, ayah.nomorAyat);

                    return (
                        <div
                            key={ayah.nomorAyat}
                            id={`ayah-${ayah.nomorAyat}`}
                            className={`group relative border-b border-secondary/40 pb-8 last:border-0 dark:border-secondary/10 transition-colors scroll-mt-24 ${isLastRead ? 'bg-secondary/30 rounded-lg p-4 -mx-4 shadow-sm' : ''}`}
                        >
                            <div className="absolute left-0 top-0 flex flex-col gap-2 items-center">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary/80 text-sm font-bold text-primary dark:bg-secondary/20">
                                    {ayah.nomorAyat}
                                </div>
                                <AyahAudioPlayer audioUrl={ayah.audio['05']} />
                                <button
                                    onClick={() => saveProgress(surah.nomor, ayah.nomorAyat)}
                                    title="Tandai Terakhir Dibaca"
                                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors mt-2 ${isLastRead
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-primary dark:hover:bg-secondary/20'
                                        }`}
                                >
                                    {isLastRead ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                                </button>
                                <button
                                    onClick={() => toggleBookmark(surah.nomor, ayah.nomorAyat)}
                                    title="Tandai Favorit"
                                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isFavorited
                                        ? 'text-yellow-500 bg-yellow-500/10'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-primary dark:hover:bg-secondary/20'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                </button>
                            </div>

                            <div className="pl-12 pt-2">
                                <div
                                    className="font-arabic text-3xl sm:text-4xl leading-[2.5] text-right mb-6 text-foreground break-words"
                                    dir="rtl"
                                >
                                    {ayah.teksArab}
                                </div>

                                <div className="space-y-3">
                                    <p className="text-primary/90 text-sm font-medium leading-relaxed tracking-wide">
                                        {ayah.teksLatin}
                                    </p>
                                    <p className="text-muted-foreground text-[15px] leading-relaxed">
                                        {ayah.teksIndonesia}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Navigation Footer */}
            <div className="mt-12 flex items-center justify-between border-t border-secondary/30 pt-6">
                {surah.suratSebelumnya ? (
                    <Link
                        href={`/surah/${surah.suratSebelumnya.nomor}`}
                        className="flex flex-col items-start gap-1 rounded-xl border border-secondary/50 bg-white p-4 shadow-sm transition-colors hover:border-primary dark:bg-white/5"
                    >
                        <span className="text-xs text-muted-foreground">Surat Sebelumnya</span>
                        <span className="font-semibold text-primary">{surah.suratSebelumnya.namaLatin}</span>
                    </Link>
                ) : <div />}

                {surah.suratSelanjutnya ? (
                    <Link
                        href={`/surah/${surah.suratSelanjutnya.nomor}`}
                        className="flex flex-col items-end gap-1 rounded-xl border border-secondary/50 bg-white p-4 shadow-sm transition-colors hover:border-primary dark:bg-white/5"
                    >
                        <span className="text-xs text-muted-foreground">Surat Selanjutnya</span>
                        <span className="font-semibold text-primary">{surah.suratSelanjutnya.namaLatin}</span>
                    </Link>
                ) : <div />}
            </div>
        </div>
    );
}
