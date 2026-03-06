'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStats } from '@/hooks/use-stats';
import { Award, Star, Flame, BookOpen, Trophy } from 'lucide-react';
import Toast from '@/components/ui/Toast';
import { AnimatePresence, motion } from 'framer-motion';

type BadgeRule = {
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
};

const LEVELS = [
    { name: 'Pemula', minXp: 0 },
    { name: 'Rajin', minXp: 500 },
    { name: 'Istiqomah', minXp: 1500 },
    { name: 'Penjaga Tilawah', minXp: 3500 },
    { name: 'Sahabat Qurani', minXp: 7000 },
    { name: 'Teladan', minXp: 12000 },
];

export default function ProgressGamificationCard() {
    const { streak, totalAyahsRead, khatamCount, weeklyActivity } = useStats();

    const xp = useMemo(() => {
        return totalAyahsRead + streak * 20 + khatamCount * 1000;
    }, [khatamCount, streak, totalAyahsRead]);

    const levelState = useMemo(() => {
        let currentLevel = LEVELS[0];
        let nextLevel = LEVELS[1] || null;

        for (let i = 0; i < LEVELS.length; i++) {
            if (xp >= LEVELS[i].minXp) {
                currentLevel = LEVELS[i];
                nextLevel = LEVELS[i + 1] || null;
            }
        }

        const progress = nextLevel
            ? Math.min(((xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100, 100)
            : 100;

        return { currentLevel, nextLevel, progress };
    }, [xp]);

    const badges = useMemo<BadgeRule[]>(() => {
        const activeWeek = weeklyActivity.filter((d) => d.count > 0).length;
        return [
            { id: 'first-ayah', title: 'Langkah Pertama', description: 'Baca ayat pertama', unlocked: totalAyahsRead >= 1 },
            { id: 'ayat-100', title: '100 Ayat', description: 'Total 100 ayat terbaca', unlocked: totalAyahsRead >= 100 },
            { id: 'ayat-1000', title: '1000 Ayat', description: 'Total 1000 ayat terbaca', unlocked: totalAyahsRead >= 1000 },
            { id: 'streak-7', title: 'Streak 7 Hari', description: 'Istiqomah 7 hari', unlocked: streak >= 7 },
            { id: 'streak-30', title: 'Streak 30 Hari', description: 'Istiqomah 30 hari', unlocked: streak >= 30 },
            { id: 'first-khatam', title: 'Khatam Pertama', description: 'Selesaikan 1x khatam', unlocked: khatamCount >= 1 },
            { id: 'triple-khatam', title: '3x Khatam', description: 'Selesaikan 3x khatam', unlocked: khatamCount >= 3 },
            { id: 'active-week', title: 'Pekan Aktif', description: 'Aktif minimal 5 hari dalam 1 minggu', unlocked: activeWeek >= 5 },
        ];
    }, [khatamCount, streak, totalAyahsRead, weeklyActivity]);

    const [unlockQueue, setUnlockQueue] = useState<string[]>([]);
    const [activeUnlock, setActiveUnlock] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const confettiPieces = useMemo(
        () =>
            Array.from({ length: 22 }).map((_, i) => ({
                id: i,
                left: 5 + (i * 4) % 90,
                delay: (i % 6) * 0.06,
                duration: 1.2 + (i % 5) * 0.22,
                rotate: -40 + (i % 9) * 10,
            })),
        []
    );

    useEffect(() => {
        const storageKey = 'jangji-notified-badges';
        const unlockedIds = badges.filter((b) => b.unlocked).map((b) => b.id);
        const storedRaw = localStorage.getItem(storageKey);

        if (!storedRaw) {
            localStorage.setItem(storageKey, JSON.stringify(unlockedIds));
            return;
        }

        let notifiedIds: string[] = [];
        try {
            notifiedIds = JSON.parse(storedRaw);
        } catch {
            notifiedIds = [];
        }

        const newUnlocked = unlockedIds.filter((id) => !notifiedIds.includes(id));
        if (newUnlocked.length > 0) {
            setTimeout(() => {
                setUnlockQueue((prev) => [...prev, ...newUnlocked]);
            }, 0);
            localStorage.setItem(storageKey, JSON.stringify([...notifiedIds, ...newUnlocked]));
        }
    }, [badges]);

    useEffect(() => {
        if (activeUnlock || unlockQueue.length === 0) return;
        const [next, ...rest] = unlockQueue;
        setTimeout(() => {
            setActiveUnlock(next);
            setUnlockQueue(rest);
            if (next === 'first-khatam') {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 1800);
            }
        }, 0);
    }, [activeUnlock, unlockQueue]);

    const activeBadge = badges.find((b) => b.id === activeUnlock);

    return (
        <>
            <AnimatePresence>
                {showConfetti && (
                    <div className="pointer-events-none fixed inset-0 z-[210] overflow-hidden">
                        {confettiPieces.map((piece) => (
                            <motion.div
                                key={piece.id}
                                initial={{ y: -20, x: 0, opacity: 0, rotate: piece.rotate }}
                                animate={{ y: 420, x: piece.id % 2 === 0 ? 26 : -26, opacity: [0, 1, 1, 0], rotate: piece.rotate + 120 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: piece.duration, delay: piece.delay, ease: 'easeOut' }}
                                className="absolute top-0 h-3 w-2 rounded-sm bg-primary"
                                style={{ left: `${piece.left}%` }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <section className="rounded-3xl border border-primary/20 bg-secondary/20 p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-primary text-white flex items-center justify-center">
                        <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Progress & Gamification</h3>
                        <p className="text-xs text-muted-foreground">Level dan badge pencapaian ibadah</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">XP</p>
                    <p className="text-lg font-black text-primary tabular-nums">{xp}</p>
                </div>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-background/80 p-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">Level {levelState.currentLevel.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {levelState.nextLevel ? `Next: ${levelState.nextLevel.name}` : 'Level Maksimum'}
                    </p>
                </div>
                <div className="h-2 w-full rounded-full bg-primary/10 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${levelState.progress}%` }} />
                </div>
                </div>

                <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Badge</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {badges.map((badge) => (
                        <div
                            key={badge.id}
                            className={`rounded-2xl border p-3 transition-colors ${badge.unlocked
                                ? 'border-primary/30 bg-primary/5'
                                : 'border-secondary/40 bg-background/40 opacity-60'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                {badge.id.includes('khatam') ? <Award className="h-4 w-4 text-primary" /> : badge.id.includes('streak') ? <Flame className="h-4 w-4 text-primary" /> : badge.id.includes('ayat') ? <BookOpen className="h-4 w-4 text-primary" /> : <Star className="h-4 w-4 text-primary" />}
                                <p className="text-sm font-bold text-foreground">{badge.title}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{badge.description}</p>
                        </div>
                    ))}
                </div>
                </div>
            </section>

            <Toast
                isVisible={!!activeBadge}
                type="success"
                message={activeBadge ? `Badge terbuka: ${activeBadge.title}` : ''}
                onClose={() => setActiveUnlock(null)}
                duration={2800}
            />
        </>
    );
}
