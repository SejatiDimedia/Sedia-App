'use client';

import { useState, useEffect } from 'react';
import SurahList from '@/components/SurahList';
import BookmarkList from '@/components/BookmarkList';
import LastReadCard from '@/components/LastReadCard';
import WelcomeScreen from '@/components/WelcomeScreen';
import ThemeToggle from '@/components/ThemeToggle';
import { UserAuthMenu } from '@/components/auth/UserAuthMenu';
import GlobalSearch from '@/components/GlobalSearch';
import Image from 'next/image';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

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
                  width={32}
                  height={32}
                  className="h-8 w-auto object-contain rounded-md"
                />
                <h1 className="hidden sm:block text-xl font-bold tracking-tight text-primary">Jangji</h1>
              </div>
              <div className="hidden md:block text-sm font-medium text-muted-foreground border-l border-secondary pl-4">
                Jejak Ngaji
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

          <section>
            <div className="mb-6 flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star text-yellow-500"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                Fav Ayat
              </h3>
            </div>
            <BookmarkList />
          </section>

          <section>
            <div className="mb-6 border-b border-border pb-2">
              <h3 className="text-xl font-semibold text-foreground">Daftar Surat</h3>
            </div>
            <SurahList />
          </section>
        </main>
      </div>
    </>
  );
}
