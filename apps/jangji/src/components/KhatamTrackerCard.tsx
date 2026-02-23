'use client';

import React, { useState } from 'react';
import { useStats } from '@/hooks/use-stats';
import { Flame, Target, TrendingUp, BarChart2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatsModal from '@/components/StatsModal';

export default function KhatamTrackerCard() {
    const { streak, completionPercentage, todayCount, goal, totalAyahsRead, totalQuranAyahs } = useStats();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const dailyProgress = goal ? Math.min((todayCount / goal.dailyTargetAyahs) * 100, 100) : 0;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setIsModalOpen(true)}
                className="group cursor-pointer relative overflow-hidden rounded-[2.5rem] bg-secondary/30 dark:bg-primary/5 border border-primary/20 p-6 sm:p-8 space-y-8 transition-all hover:shadow-md active:scale-[0.99]"
            >
                {/* Header Section: Streak & Icon */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${streak > 0 ? 'bg-primary text-white shadow-lg' : 'bg-primary/10 text-primary'}`}>
                            <Flame className={`h-6 w-6 ${streak > 0 ? 'fill-current' : ''}`} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Progres Khatam</h3>
                            <p className="text-sm text-muted-foreground">{streak} Hari Istiqomah</p>
                        </div>
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/50 dark:bg-white/5 border border-primary/10 text-primary">
                        <BarChart2 className="h-5 w-5" />
                    </div>
                </div>

                {/* Main Progress Section */}
                <div className="space-y-4">
                    <div className="flex items-end justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Target Global</span>
                            <h2 className="text-5xl font-black text-primary tracking-tighter">
                                {completionPercentage.toFixed(1)}<span className="text-2xl opacity-40 ml-1">%</span>
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-foreground tabular-nums">{totalAyahsRead.toLocaleString()} / {totalQuranAyahs.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Ayat Terbaca</p>
                        </div>
                    </div>

                    <div className="h-3 w-full bg-primary/10 dark:bg-white/5 rounded-full overflow-hidden border border-primary/5 p-0.5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${completionPercentage}%` }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                            className="h-full bg-primary rounded-full"
                        />
                    </div>
                </div>

                {/* Daily Goal Section */}
                <AnimatePresence>
                    {goal && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-6 border-t border-primary/10 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" />
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Hari Ini</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-foreground">{todayCount} / {goal.dailyTargetAyahs}</span>
                                <div className="h-1.5 w-24 bg-primary/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${dailyProgress}%` }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Decorative Arabic Text (Subtle) */}
                <div className="absolute -right-6 -bottom-6 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
                    <span className="font-arabic text-[120px] leading-none text-primary">خاتم</span>
                </div>
            </motion.div>

            <StatsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
