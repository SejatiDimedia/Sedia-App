'use client';

import { useSurahDetail } from '@/hooks/use-quran-data';
import { useProgress } from '@/hooks/use-progress';
import { useBookmarks } from '@/hooks/use-bookmarks';
import AudioPlayer from '@/components/AudioPlayer';
import AyahAudioPlayer from '@/components/AyahAudioPlayer';
import ThemeToggle from '@/components/ThemeToggle';
import { UserAuthMenu } from '@/components/auth/UserAuthMenu';
import { getJuzNumber } from '@/lib/quran-utils';
import Link from '@/components/OfflineLink';
import { useEffect, useState, useRef } from 'react';
import { BookmarkCheck, Bookmark, Star, ChevronLeft, ArrowLeft, Languages, Share2, ChevronUp, Brain, Eye, EyeOff } from 'lucide-react';
import ConfirmModal from './ui/ConfirmModal';
import Toast from './ui/Toast';
import ShareAyatModal from './ShareAyatModal';

export default function SurahReader({ nomor }: { nomor: number }) {
    const { surah, loading, error } = useSurahDetail(nomor);
    const { progress, saveProgress } = useProgress();
    const { toggleBookmark, isBookmarked } = useBookmarks();

    // UI state
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; surah: number; ayah: number } | null>(null);
    const [categoryPicker, setCategoryPicker] = useState<{ surah: number; ayah: number } | null>(null);
    const [shareModal, setShareModal] = useState<{ surah: string; ayah: number; arabic: string; translation: string; latin?: string } | null>(null);
    const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' } | null>(null);
    const [mushafMode, setMushafMode] = useState(false);

    // Memorization Mode State
    const [hapalanMode, setHapalanMode] = useState(false);
    const [hapalanConfig, setHapalanConfig] = useState<{ hideArabic: boolean; hideTranslation: boolean }>({
        hideArabic: false,
        hideTranslation: true
    });
    const [revealedAyahs, setRevealedAyahs] = useState<Record<number, { arabic?: boolean; translation?: boolean }>>({});

    // Load Mushaf Mode preference
    useEffect(() => {
        const stored = localStorage.getItem('jangji-mushaf-mode');
        if (stored === 'true') setMushafMode(true);
    }, []);

    const toggleMushafMode = () => {
        const newVal = !mushafMode;
        setMushafMode(newVal);
        localStorage.setItem('jangji-mushaf-mode', newVal.toString());
        if (newVal && hapalanMode) setHapalanMode(false); // Disable hapalan if switching to mushaf
        setToast({
            isVisible: true,
            message: newVal ? 'Mushaf Mode Aktif (Hanya Arab)' : 'Mode Terjemahan Aktif',
            type: 'success'
        });
    };

    const toggleHapalanMode = () => {
        const newVal = !hapalanMode;
        setHapalanMode(newVal);
        if (newVal && mushafMode) setMushafMode(false); // Disable mushaf if switching to hapalan
        setRevealedAyahs({}); // Reset revealed state when entering/exiting
        setToast({
            isVisible: true,
            message: newVal ? 'Mode Hapalan Aktif' : 'Mode Hapalan Dinonaktifkan',
            type: 'success'
        });
    };

    const toggleReveal = (ayahNomor: number, type: 'arabic' | 'translation') => {
        setRevealedAyahs(prev => ({
            ...prev,
            [ayahNomor]: {
                ...prev[ayahNomor],
                [type]: !prev[ayahNomor]?.[type]
            }
        }));
    };

    const handleSaveProgress = (surahNomor: number, ayahNomor: number) => {
        setConfirmModal({ isOpen: true, surah: surahNomor, ayah: ayahNomor });
    };

    const onConfirmProgress = async () => {
        if (!confirmModal) return;
        try {
            await saveProgress(confirmModal.surah, confirmModal.ayah);
            setToast({ isVisible: true, message: `Ayat ${confirmModal.ayah} berhasil ditandai sebagai terakhir baca.`, type: 'success' });
            window.dispatchEvent(new CustomEvent('jangji-progress-updated'));
        } catch (err) {
            setToast({ isVisible: true, message: 'Gagal menyimpan progres.', type: 'error' });
        }
    };

    const [currentJuz, setCurrentJuz] = useState(nomor ? getJuzNumber(nomor, 1) : 1);
    const [scrolled, setScrolled] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);

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

    // Handle sticky Juz and scroll state
    useEffect(() => {
        const handleWindowScroll = () => {
            setScrolled(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleWindowScroll);

        // Setup Intersection Observer to track Juz changes
        if (!loading && surah?.ayat) {
            observerRef.current = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const ayahNomor = parseInt(entry.target.getAttribute('data-ayah') || '1');
                        const juz = getJuzNumber(surah.nomor, ayahNomor);
                        setCurrentJuz(juz);
                    }
                });
            }, { threshold: 0.1, rootMargin: '-20% 0px -70% 0px' });

            const ayahElements = document.querySelectorAll('.ayah-item');
            ayahElements.forEach(el => observerRef.current?.observe(el));
        }

        return () => {
            window.removeEventListener('scroll', handleWindowScroll);
            observerRef.current?.disconnect();
        };
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
            <div className="mx-auto max-w-3xl pb-24 px-4 text-foreground">
                <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-secondary/20 h-16">
                    <div className="container mx-auto h-full px-4 flex items-center justify-between gap-4">
                        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                            <span className="font-bold">Kembali</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <UserAuthMenu />
                        </div>
                    </div>
                </header>
                <div className="pt-24 p-8 text-center">
                    <div className="mb-4 flex justify-center text-red-500">
                        <span className="rounded-full bg-red-500/10 p-4">
                            <ArrowLeft className="h-8 w-8" />
                        </span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Gagal memuat data</h2>
                    <p className="text-muted-foreground mb-6">{error?.message || 'Data belum tersedia secara offline. Silakan buka surat ini satu kali saat online.'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl pb-24 px-4 text-foreground">
            {/* Sticky Header Nav */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-secondary/20 h-16 transition-all duration-300">
                <div className="container mx-auto h-full px-4 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                        <span className="font-bold hidden sm:inline">Kembali</span>
                    </Link>

                    <div className="text-center">
                        <h2 className="text-[10px] font-bold text-primary tracking-widest uppercase mb-0.5">Membaca</h2>
                        <div className="flex items-center justify-center gap-2 font-bold text-foreground text-sm">
                            <span>{surah.namaLatin}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={toggleMushafMode}
                            title={mushafMode ? "Tampilkan Terjemahan" : "Mushaf Mode (Hanya Arab)"}
                            className={`p-2 rounded-xl transition-all ${mushafMode
                                ? 'bg-primary text-white shadow-md'
                                : 'text-muted-foreground hover:bg-secondary/50 dark:hover:bg-primary/10'
                                }`}
                        >
                            <Languages className="h-5 w-5" />
                        </button>
                        <button
                            onClick={toggleHapalanMode}
                            title="Mode Hapalan"
                            className={`p-2 rounded-xl transition-all ${hapalanMode
                                ? 'bg-primary text-white shadow-md'
                                : 'text-muted-foreground hover:bg-secondary/50 dark:hover:bg-primary/10'
                                }`}
                        >
                            <Brain className="h-5 w-5" />
                        </button>
                        <ThemeToggle />
                        <UserAuthMenu />
                    </div>
                </div>
            </header>

            <div className="pt-20">
                {/* Unified Floating Indicator (Surah • Juz) */}
                <div className={`fixed top-20 left-4 z-40 transition-all duration-500 transform ${scrolled ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
                    <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold shadow-lg shadow-primary/20 dark:bg-primary dark:border-primary/20 border border-white/10 text-white">
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                        <span className="tracking-wide uppercase flex items-center gap-1.5 font-bold">
                            {surah.namaLatin} <span className="opacity-40">•</span> Juz {currentJuz}
                        </span>
                    </div>
                </div>

                {/* Header */}
                <div className="relative overflow-hidden mb-8 rounded-3xl bg-gradient-to-br from-primary via-[#2E7D32] to-[#1B5E20] p-8 text-center text-white shadow-xl shadow-primary/10 border border-white/10">
                    {/* Decorative Background Arabic Pattern */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none select-none">
                        <span className="font-arabic text-[120px] sm:text-[180px] leading-none text-white whitespace-nowrap">
                            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </span>
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="mb-4 flex flex-wrap justify-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest">
                                {surah.tempatTurun}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest">
                                {surah.jumlahAyat} Ayat
                            </span>
                            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest">
                                Juz {getJuzNumber(surah.nomor, 1)}
                            </span>
                        </div>

                        <h1 className="font-arabic text-5xl font-bold mb-3 drop-shadow-md">{surah.nama}</h1>
                        <h2 className="text-2xl font-bold tracking-tight mb-2">{surah.namaLatin}</h2>
                        <p className="text-white/80 text-sm italic mb-6 max-w-lg mx-auto leading-relaxed">{surah.arti}</p>

                        {/* Full Surah Audio (Mishary Rashid Alafasy) */}
                        {surah.audioFull && surah.audioFull['05'] && (
                            <div className="w-full max-w-xs scale-90 sm:scale-100">
                                <AudioPlayer audioUrl={surah.audioFull['05']} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Bismillah (except Surah Al-Fatihah and At-Tawbah) */}
                {surah.nomor !== 1 && surah.nomor !== 9 && (
                    <div className="mb-10 text-center font-arabic text-3xl leading-loose tracking-wide text-foreground">
                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </div>
                )}

                {/* Memorization Controls (when active) */}
                {hapalanMode && (
                    <div className="mb-10 p-5 rounded-3xl bg-primary/5 border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Brain className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-primary">Mode Hapalan</h4>
                                <p className="text-[10px] font-medium text-primary/60 uppercase tracking-widest">Ketuk teks untuk melihat</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-1 bg-primary/5 rounded-2xl border border-primary/10">
                            <button
                                onClick={() => setHapalanConfig(prev => ({ ...prev, hideArabic: !prev.hideArabic }))}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${hapalanConfig.hideArabic ? 'bg-primary text-white shadow-sm' : 'text-primary/40 hover:text-primary/60'}`}
                            >
                                Arab
                            </button>
                            <button
                                onClick={() => setHapalanConfig(prev => ({ ...prev, hideTranslation: !prev.hideTranslation }))}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${hapalanConfig.hideTranslation ? 'bg-primary text-white shadow-sm' : 'text-primary/40 hover:text-primary/60'}`}
                            >
                                Latin & Terjemahan
                            </button>
                        </div>
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
                                data-ayah={ayah.nomorAyat}
                                className={`ayah-item group relative border-b border-secondary/40 pb-12 last:border-0 dark:border-secondary/10 transition-colors scroll-mt-24 ${isLastRead ? 'bg-secondary/30 rounded-2xl p-6 -mx-4 shadow-sm' : ''}`}
                            >
                                <div className="relative z-10">
                                    <div className="absolute left-0 top-0 flex flex-col gap-2 items-center">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary/80 text-sm font-bold text-primary dark:bg-secondary/20">
                                            {ayah.nomorAyat}
                                        </div>
                                    </div>

                                    <div className="pl-12 pt-2">
                                        <div
                                            onClick={() => hapalanMode && hapalanConfig.hideArabic && toggleReveal(ayah.nomorAyat, 'arabic')}
                                            className={`font-arabic leading-[2.5] text-right text-foreground break-words transition-all duration-500 cursor-pointer ${mushafMode ? 'text-4xl sm:text-5xl py-8' : 'text-3xl sm:text-4xl mb-6'} ${hapalanMode && hapalanConfig.hideArabic && !revealedAyahs[ayah.nomorAyat]?.arabic
                                                ? 'blur-lg opacity-40 select-none scale-[0.98] origin-right'
                                                : 'opacity-100'
                                                }`}
                                            dir="rtl"
                                        >
                                            {ayah.teksArab}
                                        </div>

                                        {!mushafMode && (
                                            <div className="space-y-3">
                                                <div
                                                    onClick={() => hapalanMode && hapalanConfig.hideTranslation && toggleReveal(ayah.nomorAyat, 'translation')}
                                                    className={`transition-all duration-500 cursor-pointer ${hapalanMode && hapalanConfig.hideTranslation && !revealedAyahs[ayah.nomorAyat]?.translation
                                                        ? 'blur-md opacity-30 select-none'
                                                        : 'opacity-100'
                                                        }`}
                                                >
                                                    <p className="text-primary/90 text-sm font-medium leading-relaxed tracking-wide mb-3">
                                                        {ayah.teksLatin}
                                                    </p>
                                                    <p className="text-muted-foreground text-[15px] leading-relaxed">
                                                        {ayah.teksIndonesia}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-6 flex items-center gap-3">
                                            <AyahAudioPlayer audioUrl={ayah.audio['05']} />
                                            <div className="relative">
                                                <button
                                                    onClick={() => {
                                                        if (isFavorited) {
                                                            toggleBookmark(surah.nomor, ayah.nomorAyat);
                                                        } else {
                                                            setCategoryPicker({ surah: surah.nomor, ayah: ayah.nomorAyat });
                                                        }
                                                    }}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        setCategoryPicker({ surah: surah.nomor, ayah: ayah.nomorAyat });
                                                    }}
                                                    title="Tandai Favorit"
                                                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${isFavorited
                                                        ? 'text-yellow-500 bg-yellow-500/10'
                                                        : 'text-muted-foreground hover:bg-secondary hover:text-primary dark:hover:bg-secondary/20'
                                                        }`}
                                                >
                                                    <Star className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
                                                </button>

                                                {categoryPicker?.ayah === ayah.nomorAyat && (
                                                    <div className="absolute left-0 bottom-full mb-2 z-50 bg-background border border-secondary/50 rounded-2xl p-2 shadow-xl flex flex-col gap-1 min-w-[120px]">
                                                        {['Umum', 'Doa', 'Motivasi', 'Hukum', 'Indah'].map(cat => (
                                                            <button
                                                                key={cat}
                                                                onClick={() => {
                                                                    toggleBookmark(surah.nomor, ayah.nomorAyat, cat);
                                                                    setCategoryPicker(null);
                                                                }}
                                                                className="text-left px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-primary/10 hover:text-primary transition-colors"
                                                            >
                                                                {cat}
                                                            </button>
                                                        ))}
                                                        <div className="h-px bg-secondary/30 mx-2 my-1"></div>
                                                        <button
                                                            onClick={() => setCategoryPicker(null)}
                                                            className="text-left px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                                                        >
                                                            Batal
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleSaveProgress(surah.nomor, ayah.nomorAyat)}
                                                title="Tandai Terakhir Dibaca"
                                                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${isLastRead
                                                    ? 'bg-primary text-white shadow-md scale-110'
                                                    : 'text-muted-foreground hover:bg-secondary hover:text-primary dark:hover:bg-secondary/20'
                                                    }`}
                                            >
                                                {isLastRead ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                                            </button>

                                            <button
                                                onClick={() => setShareModal({
                                                    surah: surah.namaLatin,
                                                    ayah: ayah.nomorAyat,
                                                    arabic: ayah.teksArab,
                                                    translation: ayah.teksIndonesia,
                                                    latin: ayah.teksLatin
                                                })}
                                                title="Bagikan Ayat"
                                                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-primary transition-colors dark:hover:bg-secondary/20"
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {shareModal && (
                    <ShareAyatModal
                        isOpen={!!shareModal}
                        onClose={() => setShareModal(null)}
                        surahName={shareModal.surah}
                        ayahNumber={shareModal.ayah}
                        arabicText={shareModal.arabic}
                        translation={shareModal.translation}
                        latinText={shareModal.latin}
                    />
                )}
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

            <ConfirmModal
                isOpen={confirmModal?.isOpen || false}
                onClose={() => setConfirmModal(null)}
                onConfirm={onConfirmProgress}
                title="Tandai Bacaan"
                message={`Pindah penanda terakhir baca ke Ayat ${confirmModal?.ayah}?`}
            />

            <Toast
                isVisible={toast?.isVisible || false}
                message={toast?.message || ''}
                type={toast?.type}
                onClose={() => setToast(null)}
            />
        </div>
    );
}
