'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronLeft, Sparkles, BookOpen } from 'lucide-react';
import Link from '@/components/OfflineLink';
import Tasbih from '@/components/Tasbih';
import DoaList from '@/components/DoaList';

export default function DoaPage() {
    const [activeTab, setActiveTab] = useState<'dzikir' | 'doa'>('dzikir');

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="sticky top-0 z-20 w-full border-b border-secondary/30 bg-background/80 py-4 backdrop-blur-md dark:bg-background/80">
                <div className="container mx-auto px-4 sm:px-6 flex items-center gap-4">
                    <Link href="/" className="rounded-full p-2 hover:bg-secondary/20 transition-colors">
                        <ChevronLeft className="h-6 w-6 text-foreground" />
                    </Link>
                    <h1 className="text-xl font-bold text-foreground">Dzikir & Doa</h1>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Hero Area */}
                <div className="relative mb-8 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-[#2E7D32] to-[#1B5E20] p-8 text-white shadow-lg border border-white/10">
                    {/* Decorative Background Arabic Pattern */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none select-none">
                        <span className="font-arabic text-[150px] leading-none text-white">ذِكْر</span>
                    </div>

                    <div className="relative z-10 space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">Amalan Harian</h2>
                        <p className="text-white/90 text-sm font-medium">Janji istiqomah dalam berdzikir dan berdoa setiap hari.</p>
                    </div>
                    <Sparkles className="absolute right-[-10px] top-[-10px] h-24 w-24 text-white/10" />
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-secondary/30 rounded-2xl mb-8 border border-primary/10">
                    <button
                        onClick={() => setActiveTab('dzikir')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'dzikir'
                            ? 'bg-primary text-white shadow-md'
                            : 'text-muted-foreground hover:bg-primary/5'
                            }`}
                    >
                        <RotateCcw className={`h-4 w-4 ${activeTab === 'dzikir' ? 'animate-spin-slow' : ''}`} />
                        Tasbih Digital
                    </button>
                    <button
                        onClick={() => setActiveTab('doa')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'doa'
                            ? 'bg-primary text-white shadow-md'
                            : 'text-muted-foreground hover:bg-primary/5'
                            }`}
                    >
                        <BookOpen className="h-4 w-4" />
                        Doa Harian
                    </button>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'dzikir' ? <Tasbih /> : <DoaList />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
