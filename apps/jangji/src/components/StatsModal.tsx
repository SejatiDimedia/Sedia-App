'use client';

import React, { useState } from 'react';
import { useStats } from '@/hooks/use-stats';
import { X, Calendar, TrendingUp, Info, Target, ChevronRight, Activity, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function StatsModal({ isOpen, onClose }: StatsModalProps) {
    const { streak, weeklyActivity, predictedKhatamDate, goal, totalAyahsRead, totalQuranAyahs, setKhatamTarget } = useStats();
    const [selectedDays, setSelectedDays] = useState<number | null>(null);

    const maxCount = Math.max(...weeklyActivity.map(a => a.count), 1);

    const handleSetGoal = async (days: number) => {
        await setKhatamTarget(days);
        setSelectedDays(null);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-background border border-primary/20 shadow-2xl flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-7 border-b border-primary/10">
                            <div className="flex items-center gap-3">
                                <Activity className="h-6 w-6 text-primary" />
                                <h3 className="text-xl font-bold text-foreground">Statistik Khatam</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-primary active:scale-90"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-7 sm:p-9 space-y-10 custom-scrollbar">
                            {/* Weekly Chart */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Aktivitas 7 Hari Terakhir</h4>
                                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                                        Minggu Ini
                                    </span>
                                </div>

                                <div className="flex items-end justify-between gap-2 h-44 pt-4">
                                    {weeklyActivity.map((day, idx) => (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                                            <div className="relative w-full flex-1 flex flex-col justify-end">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${(day.count / maxCount) * 100}%` }}
                                                    className={`w-full max-w-[22px] mx-auto rounded-t-lg transition-all ${day.count > 0
                                                            ? 'bg-primary shadow-sm group-hover:bg-primary/90'
                                                            : 'bg-secondary/50'
                                                        }`}
                                                />
                                                {day.count > 0 && (
                                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                        <span className="text-[10px] font-bold text-white bg-primary px-2.5 py-1 rounded-lg shadow-lg">
                                                            {day.count} Ayat
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                                {day.dayName}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Lifetime Stats */}
                            <section className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-3xl bg-secondary/30 border border-primary/10 transition-colors hover:bg-secondary/40">
                                    <TrendingUp className="h-6 w-6 text-primary mb-3" />
                                    <p className="text-3xl font-black text-foreground tracking-tight tabular-nums">{totalAyahsRead.toLocaleString()}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Ayat</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-secondary/30 border border-primary/10 transition-colors hover:bg-secondary/40">
                                    <Flame className="h-6 w-6 text-primary mb-3 fill-current" />
                                    <p className="text-3xl font-black text-foreground tracking-tight tabular-nums">{streak}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Streak Hari</p>
                                </div>
                            </section>

                            {/* Khatam Prediction */}
                            <section className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-start gap-5 transition-colors hover:bg-primary/10">
                                <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-foreground">Prediksi Khatam</h4>
                                    <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                                        {predictedKhatamDate ? (
                                            <>Insyaallah akan Khatam pada tanggal <span className="text-primary font-bold">{predictedKhatamDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>.</>
                                        ) : (
                                            <>Mulai membaca sekarang untuk memprediksi tanggal Khatam Bapak.</>
                                        )}
                                    </p>
                                </div>
                            </section>

                            {/* Goal Setting */}
                            <section className="space-y-6 pt-8 border-t border-primary/10">
                                <div className="flex items-center gap-3">
                                    <Target className="h-5 w-5 text-primary" />
                                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Target Khatam</h4>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {[30, 60, 90].map((days) => (
                                        <button
                                            key={days}
                                            onClick={() => handleSetGoal(days)}
                                            className={`py-5 rounded-2xl border transition-all flex flex-col items-center gap-1 active:scale-95 ${goal && Math.round((goal.targetKhatamDate - Date.now()) / 86400000) === days
                                                    ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20'
                                                    : 'bg-secondary/40 border-primary/10 text-muted-foreground hover:bg-secondary/60 hover:border-primary/20'
                                                }`}
                                        >
                                            <span className="text-2xl font-black">{days}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Hari</span>
                                        </button>
                                    ))}
                                </div>

                                {goal && (
                                    <div className="flex items-center gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10 text-[12px] text-muted-foreground font-medium italic leading-relaxed">
                                        <Info className="h-5 w-5 shrink-0 opacity-50" />
                                        <span>Target saat ini: <strong>{goal.dailyTargetAyahs} ayat</strong> per hari untuk Khatam <strong>{Math.round((goal.targetKhatamDate - Date.now()) / 86400000)} hari</strong> lagi.</span>
                                    </div>
                                )}
                            </section>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
