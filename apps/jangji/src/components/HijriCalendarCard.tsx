'use client';

import { usePrayerTimes } from '@/hooks/use-prayer-times';
import { getFastingInfo, HIJRI_MONTHS_ID } from '@/lib/fasting-utils';
import { Calendar, Info, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HijriCalendarCard() {
    const { data, loading } = usePrayerTimes();

    if (loading || !data) {
        return (
            <div className="h-24 animate-pulse rounded-[2rem] bg-secondary/20 border border-secondary/30"></div>
        );
    }

    const hijri = data.date.hijri;
    const fasting = getFastingInfo(parseInt(hijri.day), hijri.month.number, hijri.weekday.en);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-white/5 p-6 sm:p-8 border border-secondary/50 shadow-sm transition-all hover:shadow-md dark:border-secondary/10"
        >
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Date Display */}
                <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-primary/10 text-primary dark:bg-primary/20 transition-transform group-hover:scale-105">
                        <Calendar className="h-8 w-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Kalender Hijriah</span>
                            {fasting.isFasting && (
                                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                            )}
                        </div>
                        <h3 className="text-2xl font-bold text-foreground tracking-tight">
                            {hijri.day} {HIJRI_MONTHS_ID[hijri.month.number - 1]} {hijri.year}H
                        </h3>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">
                            {hijri.weekday.en === 'Friday' ? 'Sayyidul Ayyam (Jumat Berkah)' : hijri.weekday.en}
                        </p>
                    </div>
                </div>

                {/* Fasting Reminder */}
                <AnimatePresence>
                    {fasting.isFasting ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-4 px-5 py-4 rounded-3xl bg-primary/10 border border-primary/20 text-primary dark:bg-primary/20 min-w-[240px] shadow-inner"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold leading-tight mb-1">{fasting.label}</p>
                                <p className="text-[10px] font-medium opacity-80 leading-relaxed max-w-[180px]">
                                    {fasting.description}
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/30 text-muted-foreground text-[10px] font-bold uppercase tracking-widest border border-secondary/50">
                            <Info className="h-3.5 w-3.5" />
                            Tiada Puasa Sunnah Hari Ini
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Background Decorative Element */}
            <div className="absolute right-[-40px] top-[-30px] font-arabic text-[140px] text-primary/[0.03] select-none pointer-events-none group-hover:text-primary/[0.05] transition-colors duration-500">
                {hijri.month.ar || 'تقويم'}
            </div>
        </motion.div>
    );
}
