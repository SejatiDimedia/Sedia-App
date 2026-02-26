'use client';

import { useState, useEffect, useRef } from 'react';
import { getJuzInfo, getSurahsInJuz, getJuzNumber } from '@/lib/quran-utils';
import type { SurahDetail, Ayah } from '@/types/quran';
import { fetchSurahDetail } from '@/hooks/use-quran-data';
import AyahAudioPlayer from '@/components/AyahAudioPlayer';
import { useProgress } from '@/hooks/use-progress';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import ThemeToggle from '@/components/ThemeToggle';
import { UserAuthMenu } from '@/components/auth/UserAuthMenu';
import { BookmarkCheck, Bookmark, ChevronLeft, ChevronRight, Star, Languages, ChevronUp, Share2, Brain, Play, Pause, ChevronDown } from 'lucide-react';
import { ReaderSettings } from './ReaderSettings';
import Link from '@/components/OfflineLink';
import ConfirmModal from './ui/ConfirmModal';
import Toast from './ui/Toast';
import ShareAyatModal from './ShareAyatModal';

export default function JuzReader({ juzId }: { juzId: number }) {
    const [surahs, setSurahs] = useState<SurahDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [currentSurahName, setCurrentSurahName] = useState('');
    const observerRef = useRef<IntersectionObserver | null>(null);
    const { progress, saveProgress } = useProgress();
    const { toggleBookmark, isBookmarked } = useBookmarks();
    const { isAutoScrolling, scrollSpeed, setScrollSpeed, toggleAutoScroll, stopAutoScroll } = useAutoScroll();

    // UI state
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; surah: number; ayah: number } | null>(null);
    const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' } | null>(null);
    const [categoryPicker, setCategoryPicker] = useState<{ surah: number; ayah: number } | null>(null);
    const [shareModal, setShareModal] = useState<{ surah: string; ayah: number; arabic: string; translation: string; latin?: string } | null>(null);
    const [mushafMode, setMushafMode] = useState(false);

    // Memorization Mode State
    const [hapalanMode, setHapalanMode] = useState(false);
    const [hapalanConfig, setHapalanConfig] = useState<{ hideArabic: boolean; hideTranslation: boolean }>({
        hideArabic: false,
        hideTranslation: true
    });
    const [revealedAyahs, setRevealedAyahs] = useState<Record<string, { arabic?: boolean; translation?: boolean }>>({});

    // Load Mushaf Mode preference
    useEffect(() => {
        const stored = localStorage.getItem('jangji-mushaf-mode');
        if (stored === 'true') setMushafMode(true);
    }, []);

    const toggleMushafMode = () => {
        const newVal = !mushafMode;
        setMushafMode(newVal);
        localStorage.setItem('jangji-mushaf-mode', newVal.toString());
        if (newVal && hapalanMode) setHapalanMode(false);
        setToast({
            isVisible: true,
            message: newVal ? 'Mushaf Mode Aktif (Hanya Arab)' : 'Mode Terjemahan Aktif',
            type: 'success'
        });
    };

    const toggleHapalanMode = () => {
        const newVal = !hapalanMode;
        setHapalanMode(newVal);
        if (newVal && mushafMode) setMushafMode(false);
        setRevealedAyahs({});
        setToast({
            isVisible: true,
            message: newVal ? 'Mode Hapalan Aktif' : 'Mode Hapalan Dinonaktifkan',
            type: 'success'
        });
    };

    const toggleReveal = (key: string, type: 'arabic' | 'translation') => {
        setRevealedAyahs(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [type]: !prev[key]?.[type]
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

    const { start, end } = getJuzInfo(juzId);

    // Filter and aggregate ayat belonging to this Juza
    const juzAyat: Array<{ surahNomor: number; surahNama: string; surahNamaArab: string; ayah: Ayah }> = [];

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
                juzAyat.push({
                    surahNomor: surah.nomor,
                    surahNama: surah.namaLatin,
                    surahNamaArab: surah.nama,
                    ayah
                });
            }
        });
    });

    useEffect(() => {
        const handleWindowScroll = () => {
            setScrolled(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleWindowScroll);

        // Setup Intersection Observer to track Surah changes within Juz
        if (!loading && juzAyat.length > 0) {
            setCurrentSurahName(juzAyat[0].surahNama);

            observerRef.current = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const surahName = entry.target.getAttribute('data-surah') || '';
                        if (surahName) setCurrentSurahName(surahName);
                    }
                });
            }, { threshold: 0.1, rootMargin: '-20% 0px -70% 0px' });

            const ayahElements = document.querySelectorAll('.ayah-item');
            ayahElements.forEach(el => observerRef.current?.observe(el));
        }

        return () => {
            window.removeEventListener('scroll', handleWindowScroll);
            observerRef.current?.disconnect();
            stopAutoScroll();
        };
    }, [loading, juzAyat.length, stopAutoScroll]); // juzAyat is derived from surahs, so using length is safe here

    // Auto-scroll to hash if it exists after content is loaded
    useEffect(() => {
        if (!loading && surahs.length > 0 && typeof window !== 'undefined') {
            const hash = window.location.hash;
            if (hash) {
                const id = hash.replace('#', '');
                // Delay slightly to ensure DOM is fully painted
                setTimeout(() => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('highlight-ayah');
                        setTimeout(() => {
                            element.classList.remove('highlight-ayah');
                        }, 3000);
                    }
                }, 800);
            }
        }
    }, [loading, surahs]);

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
                            <ChevronLeft className="h-8 w-8" />
                        </span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Gagal memuat Juz</h2>
                    <p className="text-muted-foreground mb-6">{error || 'Data Juz belum tersedia secara offline. Silakan buka Juz ini satu kali saat online.'}</p>
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
            {/* Unified Floating Indicator (Surah • Juz) */}
            <div className={`fixed top-20 left-4 z-40 transition-all duration-500 transform ${scrolled ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
                <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold shadow-lg shadow-primary/20 dark:bg-primary dark:border-primary/20 border border-white/10 text-white">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                    <span className="tracking-wide uppercase flex items-center gap-1.5 font-bold">
                        {currentSurahName} <span className="opacity-40">•</span> Juz {juzId}
                    </span>
                </div>
            </div>
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

                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Desktop Controls */}
                        <div className="hidden sm:flex items-center gap-1 sm:gap-2">
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
                        </div>

                        {/* Mobile Settings Menu */}
                        <div className="sm:hidden">
                            <ReaderSettings
                                mushafMode={mushafMode}
                                toggleMushafMode={toggleMushafMode}
                                hapalanMode={hapalanMode}
                                toggleHapalanMode={toggleHapalanMode}
                            />
                        </div>

                        <div className="relative flex items-center gap-1">
                            <button
                                onClick={toggleAutoScroll}
                                title={isAutoScrolling ? "Hentikan Auto Scroll" : "Aktifkan Auto Scroll"}
                                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${isAutoScrolling
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-muted-foreground hover:bg-secondary/50 dark:hover:bg-primary/10'
                                    }`}
                            >
                                {isAutoScrolling ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                            </button>

                            {isAutoScrolling && (
                                <div className="relative" ref={speedMenuRef}>
                                    <button
                                        onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                                        className="flex h-9 items-center gap-1 rounded-xl bg-primary/10 px-2 text-[10px] font-bold text-primary transition-all hover:bg-primary/20"
                                    >
                                        <span className="hidden xs:inline">Speed</span> {scrollSpeed}
                                        <ChevronDown className={`h-3 w-3 transition-transform ${isSpeedMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    <div className={`absolute right-0 top-full mt-2 w-32 overflow-hidden rounded-xl border border-primary/20 bg-white p-1 shadow-xl transition-all duration-200 dark:bg-background ${isSpeedMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}>
                                        <div className="mb-1 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-primary/50">Kecepatan</div>
                                        {[1, 2, 3, 4, 5].map((speed) => (
                                            <button
                                                key={speed}
                                                onClick={() => {
                                                    setScrollSpeed(speed);
                                                    setIsSpeedMenuOpen(false);
                                                }}
                                                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[10px] font-bold transition-colors ${scrollSpeed === speed
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-muted-foreground hover:bg-secondary/50'
                                                    }`}
                                            >
                                                <span>Speed {speed}</span>
                                                {scrollSpeed === speed && <div className="h-1 w-1 rounded-full bg-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <UserAuthMenu />
                    </div>
                </div>
            </header>

            <div className="pt-24 space-y-12">
                {/* Header Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#2E7D32] to-[#1B5E20] p-8 text-center text-white shadow-xl shadow-primary/10 border border-white/10">
                    {/* Decorative Background Arabic Pattern */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none select-none">
                        <span className="font-arabic text-[120px] sm:text-[180px] leading-none text-white whitespace-nowrap">
                            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </span>
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em]">Al-Quranul Karim</span>
                        <h1 className="text-5xl font-bold drop-shadow-md">Juz {juzId}</h1>
                        <p className="text-white/80 text-sm font-medium">Dimulai dari <span className="text-white font-bold">{juzAyat[0]?.surahNama}</span> ayat {juzAyat[0]?.ayah.nomorAyat}</p>
                    </div>
                </div>

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

                {/* Ayat List */}
                <div className="space-y-12">
                    {juzAyat.map((item, index) => {
                        const { ayah, surahNomor, surahNama, surahNamaArab } = item;
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
                                    className={`ayah-item group relative border-b border-secondary/20 pb-12 last:border-0 transition-all ${isLastRead ? 'bg-secondary/10 rounded-2xl p-6 -mx-4 shadow-sm' : ''}`}
                                    id={`ayah-${surahNomor}-${ayah.nomorAyat}`}
                                    data-surah={surahNama}
                                >


                                    <div className="relative z-10 flex items-start justify-between gap-4 mb-4">
                                        <div className="absolute left-0 top-0 flex flex-col gap-2 items-center">
                                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary/80 text-sm font-bold text-primary dark:bg-secondary/20">
                                                {ayah.nomorAyat}
                                            </div>
                                        </div>

                                        <div className="flex-1 text-right pl-12 pt-2">
                                            <p
                                                onClick={() => hapalanMode && hapalanConfig.hideArabic && toggleReveal(`${surahNomor}-${ayah.nomorAyat}`, 'arabic')}
                                                className={`font-arabic leading-[2.5] text-foreground break-words transition-all duration-500 cursor-pointer ${mushafMode ? 'text-4xl sm:text-5xl py-8' : 'text-3xl'} ${hapalanMode && hapalanConfig.hideArabic && !revealedAyahs[`${surahNomor}-${ayah.nomorAyat}`]?.arabic
                                                    ? 'blur-lg opacity-40 select-none scale-[0.98] origin-right'
                                                    : 'opacity-100'
                                                    }`}
                                            >
                                                {ayah.teksArab}
                                            </p>
                                        </div>
                                    </div>

                                    {!mushafMode && (
                                        <div className="space-y-4">
                                            <div
                                                onClick={() => hapalanMode && hapalanConfig.hideTranslation && toggleReveal(`${surahNomor}-${ayah.nomorAyat}`, 'translation')}
                                                className={`transition-all duration-500 cursor-pointer ${hapalanMode && hapalanConfig.hideTranslation && !revealedAyahs[`${surahNomor}-${ayah.nomorAyat}`]?.translation
                                                    ? 'blur-md opacity-30 select-none'
                                                    : 'opacity-100'
                                                    }`}
                                            >
                                                <p className="text-primary/80 font-medium text-sm leading-relaxed tracking-wide mb-3">
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
                                                    if (bookmarked) {
                                                        toggleBookmark(surahNomor, ayah.nomorAyat);
                                                    } else {
                                                        setCategoryPicker({ surah: surahNomor, ayah: ayah.nomorAyat });
                                                    }
                                                }}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    setCategoryPicker({ surah: surahNomor, ayah: ayah.nomorAyat });
                                                }}
                                                title="Tandai Favorit"
                                                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${bookmarked
                                                    ? 'text-yellow-500 bg-yellow-500/10'
                                                    : 'text-muted-foreground hover:bg-secondary hover:text-primary dark:hover:bg-secondary/20'
                                                    }`}
                                            >
                                                <Star className="h-4 w-4" fill={bookmarked ? "currentColor" : "none"} />
                                            </button>

                                            {categoryPicker?.ayah === ayah.nomorAyat && categoryPicker?.surah === surahNomor && (
                                                <div className="absolute left-0 bottom-full mb-2 z-50 bg-background border border-secondary/50 rounded-2xl p-2 shadow-xl flex flex-col gap-1 min-w-[120px]">
                                                    {['Umum', 'Doa', 'Motivasi', 'Hukum', 'Indah'].map(cat => (
                                                        <button
                                                            key={cat}
                                                            onClick={() => {
                                                                toggleBookmark(surahNomor, ayah.nomorAyat, cat);
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
                                            onClick={() => handleSaveProgress(surahNomor, ayah.nomorAyat)}
                                            title="Tandai Terakhir Dibaca"
                                            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${isLastRead
                                                ? 'bg-primary text-white shadow-md scale-110'
                                                : 'text-muted-foreground hover:bg-secondary hover:text-primary dark:hover:bg-secondary/20'
                                                }`}
                                        >
                                            {isLastRead ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                                        </button>

                                        <button
                                            onClick={() => {
                                                const surahName = surahs.find(s => s.nomor === surahNomor)?.namaLatin || 'Surah';
                                                setShareModal({
                                                    surah: surahName,
                                                    ayah: ayah.nomorAyat,
                                                    arabic: ayah.teksArab,
                                                    translation: ayah.teksIndonesia,
                                                    latin: ayah.teksLatin
                                                });
                                            }}
                                            title="Bagikan Ayat"
                                            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-primary transition-colors dark:hover:bg-secondary/20"
                                        >
                                            <Share2 className="h-4 w-4" />
                                        </button>
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
        </div >
    );
}
