'use client';

import { useState, useEffect, useRef } from 'react';
import { getJuzInfo, getSurahsInJuz, getJuzNumber } from '@/lib/quran-utils';
import type { SurahDetail, Ayah } from '@/types/quran';
import { fetchSurahDetail } from '@/hooks/use-quran-data';
import AyahAudioPlayer from '@/components/AyahAudioPlayer';
import { useProgress } from '@/hooks/use-progress';
import { useBookmarks } from '@/hooks/use-bookmarks';
import ThemeToggle from '@/components/ThemeToggle';
import { UserAuthMenu } from '@/components/auth/UserAuthMenu';
import { BookmarkCheck, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function JuzReader({ juzId }: { juzId: number }) {
    const [surahs, setSurahs] = useState<SurahDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const { progress, saveProgress } = useProgress();
    const { toggleBookmark, isBookmarked } = useBookmarks();

    useEffect(() => {
        const fetchJuzData = async () => {
            setLoading(true);
            try {
                const surahIds = getSurahsInJuz(juzId);
                const results = await Promise.all(
                    surahIds.map(id => fetchSurahDetail(id))
                );

                setSurahs(results);
            } catch (err) {
                setError("Gagal memuat data Juz");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchJuzData();
    }, [juzId]);

    // Scroll listener for sticky UI
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-secondary-foreground animate-pulse">Memuat Juz {juzId}...</p>
            </div>
        );
    }

    if (error || surahs.length === 0) {
        return (
            <div className="p-8 text-center text-red-500">
                <p>{error || 'Data tidak ditemukan'}</p>
                <button onClick={() => window.location.reload()} className="mt-4 rounded bg-primary px-4 py-2 text-white">Coba Lagi</button>
            </div>
        );
    }

    const { start, end } = getJuzInfo(juzId);

    // Filter and aggregate ayat belonging to this Juza
    const juzAyat: Array<{ surahNomor: number; surahNama: string; ayah: Ayah }> = [];

    surahs.forEach(surah => {
        surah.ayat.forEach(ayah => {
            let inJuz = false;

            if (surah.nomor > start.surah && surah.nomor < end.surah) {
                inJuz = true;
            } else if (surah.nomor === start.surah && surah.nomor === end.surah) {
                inJuz = ayah.nomorAyat >= start.ayah && ayah.nomorAyat <= end.ayah;
            } else if (surah.nomor === start.surah) {
                inJuz = ayah.nomorAyat >= start.ayah;
            } else if (surah.nomor === end.surah) {
                inJuz = ayah.nomorAyat <= end.ayah;
            }

            if (inJuz) {
                juzAyat.push({ surahNomor: surah.nomor, surahNama: surah.namaLatin, ayah });
            }
        });
    });

    return (
        <div className="mx-auto max-w-3xl pb-24 px-4">
            {/* Header controls */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-secondary/20 h-16 transition-all duration-300">
                <div className="container mx-auto h-full px-4 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                        <span className="font-bold hidden sm:inline">Kembali</span>
                    </Link>

                    <div className="text-center">
                        <h2 className="text-sm font-bold text-primary tracking-widest uppercase">Membaca Per JUZ</h2>
                        <div className="flex items-center justify-center gap-2 font-bold text-foreground">
                            <span>Juz {juzId}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <UserAuthMenu />
                    </div>
                </div>
            </header>

            <div className="pt-24 space-y-12">
                {/* Header Card */}
                <div className="rounded-2xl bg-gradient-to-br from-primary to-[#2E7D32] p-8 text-center text-white shadow-lg space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Al-Quranul Karim</p>
                    <h1 className="text-4xl font-bold">Juz {juzId}</h1>
                    <p className="text-white/80 text-sm">Dimulai dari {juzAyat[0]?.surahNama} ayat {juzAyat[0]?.ayah.nomorAyat}</p>
                </div>

                {/* Ayat List */}
                <div className="space-y-12">
                    {juzAyat.map((item, index) => {
                        const { ayah, surahNomor, surahNama } = item;
                        const isLastRead = progress?.lastSurah === surahNomor && progress?.lastAyah === ayah.nomorAyat;
                        const bookmarked = isBookmarked(surahNomor, ayah.nomorAyat);

                        // Show Surah header if surah changes or at the start
                        const showSurahHeader = index === 0 || juzAyat[index - 1].surahNomor !== surahNomor;

                        return (
                            <div key={`${surahNomor}-${ayah.nomorAyat}`} className="space-y-8">
                                {showSurahHeader && (
                                    <div className="sticky top-20 z-30 py-4 bg-background/95 backdrop-blur-sm border-b border-primary/20 flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-primary">{surahNama}</h3>
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Surah {surahNomor}</span>
                                    </div>
                                )}

                                <div
                                    className={`group relative border-b border-secondary/20 pb-12 last:border-0 transition-all ${isLastRead ? 'bg-secondary/10 rounded-2xl p-6 -mx-4 shadow-sm' : ''}`}
                                    id={`ayah-${surahNomor}-${ayah.nomorAyat}`}
                                >
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary border border-primary/20">
                                                {ayah.nomorAyat}
                                            </div>
                                            <button
                                                onClick={() => toggleBookmark(surahNomor, ayah.nomorAyat)}
                                                className={`p-2 rounded-full transition-colors ${bookmarked ? 'text-primary bg-primary/10 shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'}`}
                                            >
                                                {bookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                                            </button>
                                        </div>

                                        <div className="flex-1 text-right">
                                            <p className="font-arabic text-3xl font-bold leading-[2.5] text-foreground dark:text-white/95">
                                                {ayah.teksArab}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-primary/80 font-medium text-sm leading-relaxed tracking-wide">
                                            {ayah.teksLatin}
                                        </p>
                                        <p className="text-muted-foreground text-[15px] leading-relaxed">
                                            {ayah.teksIndonesia}
                                        </p>
                                    </div>

                                    <div className="mt-6 flex justify-end items-center gap-3">
                                        <button
                                            onClick={() => {
                                                saveProgress(surahNomor, ayah.nomorAyat);
                                                window.dispatchEvent(new CustomEvent('jangji-progress-updated'));
                                            }}
                                            className={`text-xs font-bold px-4 py-1.5 rounded-full border transition-all ${isLastRead ? 'bg-primary text-white border-primary shadow-sm' : 'border-secondary/50 text-muted-foreground hover:border-primary hover:text-primary'}`}
                                        >
                                            {isLastRead ? 'Tanda Terakhir Baca' : 'Tandai Selesai'}
                                        </button>
                                        <AyahAudioPlayer audioUrl={ayah.audio['05']} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Navigation */}
                <div className="mt-12 flex items-center justify-between border-t border-secondary/30 pt-8">
                    {juzId > 1 && (
                        <Link href={`/juz/${juzId - 1}`} className="flex items-center gap-3 rounded-2xl border border-secondary/50 bg-white p-5 shadow-sm transition-all hover:border-primary dark:bg-white/5">
                            <ChevronLeft className="h-6 w-6 text-primary" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Juz Sebelumnya</span>
                                <span className="font-bold text-primary">Juz {juzId - 1}</span>
                            </div>
                        </Link>
                    )}
                    <div className="flex-1" />
                    {juzId < 30 && (
                        <Link href={`/juz/${juzId + 1}`} className="flex items-center gap-3 rounded-2xl border border-secondary/50 bg-white p-5 shadow-sm transition-all hover:border-primary dark:bg-white/5">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Juz Selanjutnya</span>
                                <span className="font-bold text-primary">Juz {juzId + 1}</span>
                            </div>
                            <ChevronRight className="h-6 w-6 text-primary" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
