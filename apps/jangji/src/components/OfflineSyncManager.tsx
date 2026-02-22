'use client';

import { useOfflineSync, useSurahs } from '@/hooks/use-quran-data';
import { Download, CheckCircle2, Loader2, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineSyncManager() {
    const { surahs } = useSurahs();
    const { syncAll, isSyncing, progress, currentSurah, isComplete } = useOfflineSync();

    return (
        <div className="relative overflow-hidden rounded-2xl bg-secondary/30 dark:bg-primary/5 border border-primary/20 dark:border-primary/20 shadow-sm transition-all hover:shadow-md">
            <div className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${isComplete ? 'bg-green-100 text-green-600 dark:bg-green-900/40' : 'bg-primary/10 text-primary dark:bg-primary/20'}`}>
                            {isComplete ? <CheckCircle2 className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-primary dark:text-primary">Akses Offline 30 Juz</h3>
                            <p className="text-xs text-primary/70 dark:text-primary/80 font-medium">
                                {isComplete
                                    ? 'Semua data Al-Quran sudah siap di HP kamu.'
                                    : 'Siapkan seluruh data Surat agar bisa dibuka tanpa internet.'}
                            </p>
                        </div>
                    </div>

                    {!isSyncing && !isComplete && (
                        <button
                            onClick={() => syncAll(surahs)}
                            disabled={surahs.length === 0}
                            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                        >
                            <Download className="h-4 w-4" />
                            Siapkan Offline
                        </button>
                    )}

                    {isComplete && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-bold text-sm bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg border border-green-200 dark:border-green-900/30">
                            <CheckCircle2 className="h-4 w-4" />
                            Siap Offline
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {isSyncing && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-6 space-y-3"
                        >
                            <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-primary/80 dark:text-primary flex items-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                    Mendownload: <span className="text-primary font-bold">{currentSurah}</span>
                                </span>
                                <span className="text-primary font-bold">{progress}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-primary/10 dark:bg-primary/20">
                                <motion.div
                                    className="h-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute right-0 top-0 -mr-8 -mt-8 opacity-[0.05] dark:opacity-[0.08] pointer-events-none">
                <Download className="h-32 w-32 rotate-12 text-primary" />
            </div>
        </div>
    );
}
