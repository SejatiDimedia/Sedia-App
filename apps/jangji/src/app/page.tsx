'use client';

import { useState, useEffect } from 'react';
import BookmarkList from '@/components/BookmarkList';
import LastReadCard from '@/components/LastReadCard';
import WelcomeScreen from '@/components/WelcomeScreen';
import HijriCalendarCard from '@/components/HijriCalendarCard';
import KhatamTrackerCard from '@/components/KhatamTrackerCard';
import ThemeToggle from '@/components/ThemeToggle';
import { UserAuthMenu } from '@/components/auth/UserAuthMenu';
import GlobalSearch from '@/components/GlobalSearch';
import Image from 'next/image';
import { Heart, BookOpen, Clock, Navigation } from 'lucide-react';
import OfflineSyncManager from '@/components/OfflineSyncManager';
import Link from '@/components/OfflineLink';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    const welcomed = localStorage.getItem('jangji-welcomed');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowWelcome(!welcomed);
  }, []);

  const handleStart = () => {
    localStorage.setItem('jangji-welcomed', 'true');
    setShowWelcome(false);
  };

  if (showWelcome === null) return null; // Prevent flicker

  const menus = [
    {
      title: "Al-Qur'an",
      subtitle: "Baca Surat & Juz",
      href: "/quran",
      icon: BookOpen,
      iconColor: "text-primary dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
      hoverRing: "group-hover:ring-emerald-200 dark:group-hover:ring-emerald-500/30",
    },
    {
      title: "Jadwal & Kiblat",
      subtitle: "Sholat & Arah",
      href: "/sholat",
      icon: Clock,
      iconColor: "text-primary dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
      hoverRing: "group-hover:ring-primary/30 dark:group-hover:ring-blue-500/30",
    },
    {
      title: "Dzikir & Doa",
      subtitle: "Tasbih & Harian",
      href: "/doa",
      icon: Navigation,
      iconColor: "text-primary dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10",
      hoverRing: "group-hover:ring-orange-200 dark:group-hover:ring-orange-500/30",
    }
  ];

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

        <main className="container mx-auto px-4 py-8 sm:px-6 space-y-10">
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
                  Pusat Ibadah Harian
                </h2>
                <p className="mx-auto max-w-xl text-base sm:text-lg text-white/90 leading-relaxed font-medium">
                  Baca Al-Quran, pantau jadwal sholat, tentukan arah kiblat, dan evaluasi progres ibadah Anda dengan mudah di manapun.
                </p>
              </div>
            </div>
          </section>

          {/* App Menu Grid */}
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {menus.map((menu) => {
              const Icon = menu.icon;
              return (
                <Link
                  key={menu.title}
                  href={menu.href}
                  className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-secondary/30 dark:bg-primary/5 border border-primary/20 shadow-sm transition-all duration-300 text-center relative overflow-hidden hover:shadow-md hover:-translate-y-1"
                >
                  <div className="mb-4 flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary shadow-inner transition-transform group-hover:scale-110">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-bold text-lg mb-1 text-foreground transition-colors group-hover:text-primary">{menu.title}</h3>
                  <p className="text-sm font-medium text-primary/70 dark:text-primary/80">{menu.subtitle}</p>
                </Link>
              );
            })}
          </section>

          <OfflineSyncManager />
          <KhatamTrackerCard />
          <HijriCalendarCard />
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
