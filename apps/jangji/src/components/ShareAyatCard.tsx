'use client';

import React from 'react';

interface ShareAyatCardProps {
    surahName: string;
    ayahNumber: number;
    arabicText: string;
    translation: string;
    latinText?: string;
    showTranslation?: boolean;
    showLatin?: boolean;
    theme?: 'green' | 'blue' | 'dark' | 'gold';
    layout?: 'square' | 'portrait';
}

export default function ShareAyatCard({
    surahName,
    ayahNumber,
    arabicText,
    translation,
    latinText,
    showTranslation = true,
    showLatin = false,
    theme = 'green',
    layout = 'square'
}: ShareAyatCardProps) {

    const isPortrait = layout === 'portrait';

    const themes = {
        green: 'from-emerald-700 via-teal-800 to-emerald-950',
        blue: 'from-blue-700 via-indigo-800 to-blue-950',
        dark: 'from-zinc-900 via-black to-zinc-950',
        gold: 'from-amber-700 via-amber-800 to-amber-950'
    };

    // Dynamic Font Sizing Logic
    const getArabicFontSize = (text: string) => {
        const length = text.length;
        if (isPortrait) {
            if (length < 150) return 'text-[82px]';
            if (length < 300) return 'text-[70px]';
            if (length < 500) return 'text-[60px]';
            return 'text-[50px]';
        }
        if (length < 80) return 'text-[82px]';
        if (length < 150) return 'text-[70px]';
        if (length < 250) return 'text-[58px]';
        if (length < 400) return 'text-[48px]';
        return 'text-[40px]';
    };

    const getTranslationFontSize = (text: string) => {
        const length = text.length;
        if (isPortrait) {
            if (length < 300) return 'text-[40px]';
            if (length < 600) return 'text-[34px]';
            if (length < 900) return 'text-[28px]';
            return 'text-[24px]';
        }
        if (length < 150) return 'text-[34px]';
        if (length < 300) return 'text-[28px]';
        if (length < 500) return 'text-[24px]';
        return 'text-[20px]';
    };

    return (
        <div
            id="share-ayat-card"
            className={`relative flex items-center justify-center text-white overflow-hidden ${isPortrait ? 'w-[1080px] h-[1920px] p-24' : 'w-[1080px] h-[1080px] p-20'
                }`}
            style={{
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
        >
            {/* Elegant Deep Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${themes[theme]}`} />

            {/* Subtle Gradient Overlay for Depth */}
            <div className="absolute inset-0 bg-black/20" />

            {/* Light Source Glow */}
            <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

            {/* The Inner "Glass" Card - Simplified & Elegant */}
            <div className={`relative z-10 w-full h-full rounded-[5.5rem] bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden ${isPortrait ? 'p-32' : 'p-20 md:p-24'
                }`}>

                {/* Header: Pure Minimalist (No Logo/Name) */}
                <div className={`flex items-center justify-center ${isPortrait ? 'mb-28' : 'mb-auto'}`}>
                    <div className="px-10 py-4 rounded-[2rem] bg-white/[0.05] border border-white/10 text-2xl font-bold tracking-[0.2em] text-white/80 uppercase shadow-lg">
                        QS. {surahName} : {ayahNumber}
                    </div>
                </div>

                {/* Content Area */}
                <div className={`flex-[3] flex flex-col justify-center gap-14 text-center items-center ${isPortrait ? 'py-20' : 'py-10'}`}>
                    <div className={`flex flex-col items-center w-full ${isPortrait ? 'gap-20' : 'gap-12'}`}>
                        {/* Arabic Text - Clean & Powerful */}
                        <p className={`font-arabic ${getArabicFontSize(arabicText)} leading-[1.7] text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.6)] dir-rtl text-center max-w-[95%] font-medium`}>
                            {arabicText}
                        </p>

                        {/* Minimal Separator */}
                        <div className="w-20 h-1 bg-white/20 rounded-full" />

                        {/* Text Details */}
                        <div className={`w-full max-w-[850px] ${isPortrait ? 'space-y-14' : 'space-y-10'}`}>
                            {showLatin && latinText && (
                                <p className="text-2xl font-medium italic text-white/40 leading-relaxed px-10">
                                    "{latinText}"
                                </p>
                            )}

                            {showTranslation && (
                                <p className={`${getTranslationFontSize(translation)} font-medium text-white/90 leading-snug tracking-tight px-4`}>
                                    {translation}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Branding - Copyright Info Only */}
                <div className={`mt-auto border-t border-white/5 flex flex-col items-center gap-4 ${isPortrait ? 'pt-24' : 'pt-16'}`}>
                    <span className="text-sm font-bold tracking-[0.6em] text-white/25 uppercase">
                        &copy;Jangji — SejatiDimedia
                    </span>
                </div>
            </div>

            {/* Subtle Corner Accents */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.02] blur-3xl rounded-full" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/10 blur-3xl rounded-full" />
        </div>
    );
}
