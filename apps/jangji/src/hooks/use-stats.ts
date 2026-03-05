'use client';

import { useState, useEffect, useMemo } from 'react';
import { db, ReadingHistory, UserGoal, JuzCompletionEvent, ManualKhatamEvent } from '@/lib/dexie';
import { authClient } from '@/lib/auth-client';
import { useSurahs } from './use-quran-data';

function getLocalDateKey(timestamp = Date.now()): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

type KhatamHistoryItem = {
    completedAt: number;
    source: 'auto' | 'manual';
    note?: string;
};

export function useStats() {
    const { data: session } = authClient.useSession();
    const { surahs } = useSurahs();
    const [history, setHistory] = useState<ReadingHistory[]>([]);
    const [juzEvents, setJuzEvents] = useState<JuzCompletionEvent[]>([]);
    const [manualKhatamEvents, setManualKhatamEvents] = useState<ManualKhatamEvent[]>([]);
    const [goal, setGoal] = useState<UserGoal | null>(null);
    const [totalAyahsRead, setTotalAyahsRead] = useState(0);

    const userId = session?.user?.id || 'guest';

    useEffect(() => {
        async function load() {
            const h = await db.readingHistory.where('userId').equals(userId).toArray();
            setHistory(h);
            const events = await db.juzCompletionEvents.where('userId').equals(userId).toArray();
            setJuzEvents(events);
            const manualEvents = await db.manualKhatamEvents.where('userId').equals(userId).toArray();
            setManualKhatamEvents(manualEvents);

            const g = await db.userGoals.get(userId);
            setGoal(g || null);

            const uniqueGlobalAyahs = new Set<string>();
            h.forEach((item) => {
                (item.readAyahKeys || []).forEach((key) => uniqueGlobalAyahs.add(key));
            });
            const fallbackTotal = h.reduce((acc, curr) => acc + curr.ayahCount, 0);
            const total = uniqueGlobalAyahs.size > 0 ? uniqueGlobalAyahs.size : fallbackTotal;
            setTotalAyahsRead(total);
        }
        load();

        const refreshStats = () => load();
        if (typeof window !== 'undefined') {
            window.addEventListener('jangji-progress-updated', refreshStats);
            window.addEventListener('jangji-khatam-updated', refreshStats);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('jangji-progress-updated', refreshStats);
                window.removeEventListener('jangji-khatam-updated', refreshStats);
            }
        };
    }, [userId]);

    const totalQuranAyahs = useMemo(() => {
        return surahs.reduce((acc, s) => acc + s.jumlahAyat, 0) || 6236;
    }, [surahs]);

    const stats = useMemo(() => {
        const sortedEvents = [...juzEvents].sort((a, b) => a.completedAt - b.completedAt);
        const completedJuz = new Set<number>();
        const khatamDates: number[] = [];

        sortedEvents.forEach((event) => {
            if (event.juzNumber < 1 || event.juzNumber > 30) return;
            completedJuz.add(event.juzNumber);
            if (completedJuz.size === 30) {
                khatamDates.push(event.completedAt);
                completedJuz.clear();
            }
        });

        const autoKhatamCount = khatamDates.length;
        const manualKhatamDates = manualKhatamEvents.map((event) => event.completedAt);
        const khatamCount = autoKhatamCount + manualKhatamDates.length;
        const lastKhatamAt = [...khatamDates, ...manualKhatamDates].sort((a, b) => a - b).at(-1) ?? null;
        const khatamHistory: KhatamHistoryItem[] = [
            ...khatamDates.map((date) => ({ completedAt: date, source: 'auto' as const })),
            ...manualKhatamEvents.map((event) => ({
                completedAt: event.completedAt,
                source: 'manual' as const,
                note: event.note,
            })),
        ].sort((a, b) => b.completedAt - a.completedAt);

        if (history.length === 0) return {
            streak: 0,
            completionPercentage: 0,
            todayCount: 0,
            todayTapCount: 0,
            weeklyActivity: [],
            predictedKhatamDate: null,
            khatamCount,
            lastKhatamAt,
            khatamHistory,
        };

        // 1. Calculate Streak
        let streak = 0;
        const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));
        const nowMs = new Date().getTime();
        const today = getLocalDateKey(nowMs);
        const yesterday = getLocalDateKey(nowMs - 86400000);

        let checkDate = today;
        const historyMap = new Map(history.map(h => [h.date, h]));

        if (!historyMap.has(today) && !historyMap.has(yesterday)) {
            streak = 0;
        } else {
            if (!historyMap.has(today)) checkDate = yesterday;

            const tempDate = new Date(checkDate);
            while (true) {
                const dateString = getLocalDateKey(tempDate.getTime());
                if (historyMap.has(dateString)) {
                    streak++;
                    tempDate.setDate(tempDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        // 2. Completion Percentage
        const completionPercentage = Math.min((totalAyahsRead / totalQuranAyahs) * 100, 100);

        // 3. Weekly Activity (Last 7 days)
        const weeklyActivity = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(nowMs - i * 86400000);
            const ds = getLocalDateKey(d.getTime());
            weeklyActivity.push({
                date: ds,
                dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
                count: historyMap.get(ds)?.ayahCount || 0
            });
        }

        // 4. Prediction
        let predictedKhatamDate = null;
        if (totalAyahsRead > 0) {
            // Average ayahs per day over recorded period
            const firstDate = new Date(sortedHistory[sortedHistory.length - 1].date);
            const daysDiff = Math.max(Math.ceil((nowMs - firstDate.getTime()) / 86400000), 1);
            const avgPerDay = totalAyahsRead / daysDiff;

            if (avgPerDay > 0) {
                const ayahsLeft = totalQuranAyahs - totalAyahsRead;
                const daysLeft = Math.ceil(ayahsLeft / avgPerDay);
                predictedKhatamDate = new Date(nowMs + daysLeft * 86400000);
            }
        }

        return {
            streak,
            completionPercentage,
            todayCount: historyMap.get(today)?.ayahCount || 0,
            todayTapCount: historyMap.get(today)?.dailyTapCount || historyMap.get(today)?.ayahCount || 0,
            weeklyActivity,
            predictedKhatamDate,
            khatamCount,
            lastKhatamAt,
            khatamHistory,
        };
    }, [history, juzEvents, manualKhatamEvents, totalAyahsRead, totalQuranAyahs]);

    const setKhatamTarget = async (days: number) => {
        const targetDate = Date.now() + days * 86400000;
        const ayahsLeft = totalQuranAyahs - totalAyahsRead;
        const dailyTarget = Math.ceil(ayahsLeft / days);

        const newGoal: UserGoal = {
            userId,
            targetKhatamDate: targetDate,
            dailyTargetAyahs: dailyTarget
        };

        await db.userGoals.put(newGoal);
        setGoal(newGoal);
    };

    const addManualKhatam = async (completedAt: number, note?: string) => {
        await db.manualKhatamEvents.add({
            userId,
            completedAt,
            note,
        });
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('jangji-khatam-updated'));
        }
    };

    return { ...stats, goal, totalAyahsRead, totalQuranAyahs, setKhatamTarget, addManualKhatam };
}
