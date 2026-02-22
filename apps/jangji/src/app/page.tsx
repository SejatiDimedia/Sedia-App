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
          <section className="rounded-2xl bg-primary/10 p-6 text-center sm:p-10 border border-primary/20 shadow-sm">
            <h2 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
              Aplikasi Baca Al-Quran
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Baca dan pelajari Al-Quran dengan mudah. Disertai terjemahan, transliterasi Latin, dan dapat diakses sepenuhnya secara offline.
            </p>
          </section>

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
      </div>
    </>
  );
}
