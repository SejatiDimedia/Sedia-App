'use client';

import PrayerTimesCard from '@/components/PrayerTimesCard';
import QiblaCompass from '@/components/QiblaCompass';
import { ChevronLeft } from 'lucide-react';
import Link from '@/components/OfflineLink';

export default function SholatPage() {
    return (
        <div className="min-h-screen bg-background text-foreground transition-colors dark:bg-background/95">
            <header className="sticky top-0 z-20 w-full border-b border-secondary/30 bg-background/80 py-4 backdrop-blur-md dark:bg-background/80">
                <div className="container mx-auto px-4 sm:px-6 flex items-center gap-4">
                    <Link href="/" className="rounded-full p-2 hover:bg-secondary/20 transition-colors">
                        <ChevronLeft className="h-6 w-6 text-foreground" />
                    </Link>
                    <h1 className="text-xl font-bold text-foreground">Jadwal & Kiblat</h1>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 sm:px-6 max-w-2xl space-y-12">
                <PrayerTimesCard />

                <div className="pt-6 border-t border-secondary/30">
                    <QiblaCompass />
                </div>
            </main>
        </div>
    );
}
