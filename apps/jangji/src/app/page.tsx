'use client';

import { useState, useEffect } from 'react';
import SurahList from '@/components/SurahList';
import BookmarkList from '@/components/BookmarkList';
import LastReadCard from '@/components/LastReadCard';
import WelcomeScreen from '@/components/WelcomeScreen';
import ThemeToggle from '@/components/ThemeToggle';
import { UserAuthMenu } from '@/components/auth/UserAuthMenu';
import GlobalSearch from '@/components/GlobalSearch';
import JuzList from '@/components/JuzList';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, BookOpen } from 'lucide-react';
import OfflineSyncManager from '@/components/OfflineSyncManager';
import PrayerTimesCard from '@/components/PrayerTimesCard';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'surah' | 'juz'>('surah');

  useEffect(() => {
    const welcomed = localStorage.getItem('jangji-welcomed');
    setShowWelcome(!welcomed);
  }, []);

  const handleStart = () => {
    localStorage.setItem('jangji-welcomed', 'true');
    setShowWelcome(false);
  };

  if (showWelcome === null) return null; // Prevent flicker

  return (
    <>
      {showWelcome && <WelcomeScreen onStart={handleStart} />}
      <div className="min-h-screen bg-background text-foreground transition-colors dark:bg-background/95">
        <header className="sticky top-0 z-20 w-full border-b border-secondary/30 bg-background/80 py-3 backdrop-blur-md dark:bg-background/80">
          <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <Image
                  src="/Jangji_Logo.png"
                  alt="Jangji Logo"
                  width={60}
                  height={60}
                  className="h-16 w-auto object-contain rounded-lg"
                />
              </div>
            </div>

            <div className="flex-1 max-w-sm mx-auto flex justify-center">
              <GlobalSearch />
            </div>

            <div className="shrink-0 flex items-center gap-2 justify-end">
              <ThemeToggle />
              <UserAuthMenu />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 sm:px-6 space-y-12">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#2E7D32] to-[#1B5E20] p-8 text-center sm:p-12 shadow-xl shadow-primary/10 border border-white/10">
            {/* Decorative Background Arabic Pattern */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] pointer-events-none select-none">
              <span className="font-arabic text-[180px] sm:text-[240px] leading-none text-white whitespace-nowrap">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </span>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner mb-2 lg:mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl drop-shadow-sm">
                  Aplikasi Baca Al-Quran
                </h2>
                <p className="mx-auto max-w-xl text-base sm:text-lg text-white/90 leading-relaxed font-medium">
                  Baca dan pelajari Al-Quran dengan mudah. Disertai terjemahan, transliterasi Latin, dan dapat diakses sepenuhnya secara offline.
                </p>
              </div>
            </div>
          </section>

          <PrayerTimesCard />
          <OfflineSyncManager />
          <LastReadCard />

          <div className="flex flex-col gap-12">
            {/* Favorit Saya Section */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                  <Heart className="h-5 w-5 fill-current" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Favorit Saya</h2>
              </div>
              <BookmarkList />
            </div>

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
                <h2 className="text-xl font-bold text-foreground">Daftar {activeTab === 'surah' ? 'Surah' : 'Juz'}</h2>
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
          </div>
        </main>

        <footer className="container mx-auto px-4 py-8 mt-12 border-t border-secondary/20">
          <div className="flex flex-col items-center justify-center gap-2">
            <p className="text-xs font-medium text-muted-foreground/60 tracking-wider">
              &copy;2026 Jangji-SejatiDimedia
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
