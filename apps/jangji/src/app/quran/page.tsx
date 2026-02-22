'use client';

import { useState } from 'react';
import SurahList from '@/components/SurahList';
import JuzList from '@/components/JuzList';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import Link from '@/components/OfflineLink';

export default function QuranPage() {
    const [activeTab, setActiveTab] = useState<'surah' | 'juz'>('surah');

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors dark:bg-background/95">
            <header className="sticky top-0 z-20 w-full border-b border-secondary/30 bg-background/80 py-4 backdrop-blur-md dark:bg-background/80">
                <div className="container mx-auto px-4 sm:px-6 flex items-center gap-4">
                    <Link href="/" className="rounded-full p-2 hover:bg-secondary/20 transition-colors">
                        <ChevronLeft className="h-6 w-6 text-foreground" />
                    </Link>
                    <h1 className="text-xl font-bold text-foreground">Al-Qur&apos;an</h1>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 sm:px-6 space-y-8">
                {/* Main List & Sections (Tabs) */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex p-1 bg-secondary/30 rounded-xl border border-secondary/50">
                            <button
                                onClick={() => setActiveTab('surah')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'surah' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-primary'}`}
                            >
                                Surah
                            </button>
                            <button
                                onClick={() => setActiveTab('juz')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'juz' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-primary'}`}
                            >
                                Juz
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'surah' ? <SurahList /> : <JuzList />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
