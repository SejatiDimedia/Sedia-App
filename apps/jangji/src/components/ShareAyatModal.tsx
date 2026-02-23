'use client';

import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Share2, Download, X, Check, Loader2, Maximize2, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ShareAyatCard from './ShareAyatCard';

interface ShareAyatModalProps {
    isOpen: boolean;
    onClose: () => void;
    surahName: string;
    ayahNumber: number;
    arabicText: string;
    translation: string;
    latinText?: string;
}

export default function ShareAyatModal({
    isOpen,
    onClose,
    surahName,
    ayahNumber,
    arabicText,
    translation,
    latinText
}: ShareAyatModalProps) {
    const [theme, setTheme] = useState<'green' | 'blue' | 'dark' | 'gold'>('green');
    const [layout, setLayout] = useState<'square' | 'portrait'>('square');
    const [showLatin, setShowLatin] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isShared, setIsShared] = useState(false);

    const generateImage = async () => {
        const element = document.getElementById('share-ayat-card');
        if (!element) return null;

        try {
            setIsGenerating(true);
            const dataUrl = await toPng(element, {
                cacheBust: true,
                width: 1080,
                height: layout === 'portrait' ? 1920 : 1080,
                pixelRatio: 1
            });
            return dataUrl;
        } catch (err) {
            console.error('Failed to generate image', err);
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        const dataUrl = await generateImage();
        if (dataUrl) {
            const link = document.createElement('a');
            link.download = `Jangji-Ayat-${surahName}-${ayahNumber}.png`;
            link.href = dataUrl;
            link.click();
        }
    };

    const handleShare = async () => {
        const dataUrl = await generateImage();
        if (!dataUrl) return;

        try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], `Ayat-${surahName}-${ayahNumber}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Ayat Al-Quran: ${surahName} : ${ayahNumber}`,
                    text: `Bagikan kebaikan dari Jangji App. QS. ${surahName}:${ayahNumber}`
                });
                setIsShared(true);
                setTimeout(() => setIsShared(false), 3000);
            } else {
                if (navigator.share) {
                    await navigator.share({
                        title: `QS. ${surahName} : ${ayahNumber}`,
                        text: `${arabicText}\n\n${translation}\n\nBaca selengkapnya di Jangji App.`,
                        url: window.location.href
                    });
                } else {
                    handleDownload();
                }
            }
        } catch (err) {
            console.error('Error sharing', err);
            handleDownload();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-6xl bg-background rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl border border-primary/10 dark:border-white/10 flex flex-col md:flex-row h-[95vh] md:h-auto max-h-[900px] mx-auto"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 md:right-8 md:top-8 z-30 p-2.5 rounded-2xl bg-foreground/5 hover:bg-foreground/10 text-foreground border border-foreground/5 transition-all active:scale-90"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {/* Preview Area (Left / Top) */}
                    <div className="flex-[1.8] bg-secondary/10 dark:bg-[#0A0A0A] p-6 sm:p-12 lg:p-16 flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-foreground/5 min-h-[450px] md:min-h-[650px] relative transition-colors duration-500">
                        {/* Subtle background glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                        {/* Card Scaling Container */}
                        <div className="relative flex items-center justify-center w-full h-full">
                            <div
                                className={`shrink-0 transform transition-all duration-700 ease-out origin-center shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_80px_180px_-40px_rgba(0,0,0,0.8)] rounded-[6.5rem] overflow-hidden ring-8 md:ring-12 ring-foreground/5 dark:ring-white/5 ring-offset-2 md:ring-offset-4 ring-offset-background dark:ring-offset-black ${layout === 'portrait'
                                        ? 'w-[1080px] h-[1920px] scale-[0.12] xs:scale-[0.16] sm:scale-[0.2] md:scale-[0.24] lg:scale-[0.28] xl:scale-[0.32]'
                                        : 'w-[1080px] h-[1080px] scale-[0.22] xs:scale-[0.28] sm:scale-[0.36] md:scale-[0.4] lg:scale-[0.48] xl:scale-[0.55]'
                                    }`}
                            >
                                {/* The actual card that will be captured */}
                                <ShareAyatCard
                                    surahName={surahName}
                                    ayahNumber={ayahNumber}
                                    arabicText={arabicText}
                                    translation={translation}
                                    latinText={latinText}
                                    theme={theme}
                                    showLatin={showLatin}
                                    layout={layout}
                                />
                            </div>
                        </div>

                        {/* Hidden Full-Size Card for Capture */}
                        <div className="absolute opacity-0 pointer-events-none -left-[5000px] top-0">
                            <ShareAyatCard
                                surahName={surahName}
                                ayahNumber={ayahNumber}
                                arabicText={arabicText}
                                translation={translation}
                                latinText={latinText}
                                theme={theme}
                                showLatin={showLatin}
                                layout={layout}
                            />
                        </div>
                    </div>

                    {/* Controls Area (Right / Bottom) */}
                    <div className="w-full md:w-[380px] lg:w-[420px] p-8 md:p-10 bg-background flex flex-col gap-8 md:gap-10 overflow-y-auto overflow-x-hidden custom-scrollbar">
                        <div className="flex-shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2 block">Design Studio</span>
                            <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter mb-1">Berbagi Ayat</h3>
                            <p className="text-sm font-medium text-muted-foreground/80 italic">QS. {surahName} : {ayahNumber}</p>
                        </div>

                        {/* Layout Selection */}
                        <div className="space-y-4 md:space-y-5 flex-shrink-0">
                            <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Format Card</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setLayout('square')}
                                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${layout === 'square'
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-foreground/5 dark:border-white/5 text-muted-foreground hover:bg-foreground/5'
                                        }`}
                                >
                                    <Square className="h-5 w-5" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Square (1:1)</span>
                                </button>
                                <button
                                    onClick={() => setLayout('portrait')}
                                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${layout === 'portrait'
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-foreground/5 dark:border-white/5 text-muted-foreground hover:bg-foreground/5'
                                        }`}
                                >
                                    <Maximize2 className="h-5 w-5 rotate-90" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Portrait (9:16)</span>
                                </button>
                            </div>
                            {layout === 'square' && arabicText.length > 200 && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium italic">
                                    Tip: Ayat ini cukup panjang, format Portrait disarankan agar lebih jelas.
                                </p>
                            )}
                        </div>

                        {/* Theme Selection */}
                        <div className="space-y-4 md:space-y-5 flex-shrink-0">
                            <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Palet Warna Utama</label>
                            <div className="grid grid-cols-4 gap-3 md:gap-4">
                                {(['green', 'blue', 'dark', 'gold'] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTheme(t)}
                                        className={`group relative h-12 md:h-14 rounded-2xl border-2 transition-all overflow-hidden ${theme === t ? 'border-primary ring-4 ring-primary/10 dark:ring-primary/20 scale-105' : 'border-foreground/5 dark:border-white/5 hover:border-primary/40'}`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br transition-transform group-hover:scale-110 ${t === 'green' ? 'from-emerald-600 to-teal-800' :
                                                t === 'blue' ? 'from-blue-600 to-indigo-800' :
                                                    t === 'dark' ? 'from-zinc-800 to-black' :
                                                        'from-amber-500 to-orange-700'
                                            }`} />
                                        {theme === t && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-black/20 backdrop-blur-[1px]">
                                                <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-white flex items-center justify-center shadow-lg transform scale-110">
                                                    <Check className="h-3 w-3 md:h-4 md:w-4 text-primary stroke-[3px]" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Configuration */}
                        <div className="space-y-4 md:space-y-5 flex-shrink-0">
                            <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Konfigurasi Konten</label>
                            <button
                                onClick={() => setShowLatin(!showLatin)}
                                className={`group w-full flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all ${showLatin
                                        ? 'bg-primary/5 dark:bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/5'
                                        : 'bg-secondary/20 dark:bg-secondary/10 border-foreground/5 dark:border-white/5 text-muted-foreground hover:bg-secondary/30'
                                    }`}
                            >
                                <span className="text-sm font-bold uppercase tracking-widest">Tampilkan Latin</span>
                                <div className={`relative w-11 h-6 rounded-full transition-all duration-300 ${showLatin ? 'bg-primary' : 'bg-foreground/10 dark:bg-white/10'}`}>
                                    <div className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300 ${showLatin ? 'translate-x-5' : ''}`} />
                                </div>
                            </button>
                        </div>

                        <div className="mt-auto flex flex-col gap-3 md:gap-4 flex-shrink-0 pb-2">
                            <button
                                onClick={handleShare}
                                disabled={isGenerating}
                                className="w-full flex items-center justify-center gap-3 py-4 md:py-5 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/95 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
                            >
                                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />}
                                {isShared ? 'Tersalin!' : 'Bagikan Gambar'}
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="w-full flex items-center justify-center gap-3 py-4 md:py-5 rounded-2xl bg-secondary/30 dark:bg-secondary/10 text-foreground font-bold text-sm uppercase tracking-widest border border-foreground/5 dark:border-white/5 hover:bg-secondary/40 transition-all active:scale-95"
                            >
                                <Download className="h-5 w-5 opacity-60" />
                                Simpan Perangkat
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
