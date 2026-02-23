'use client';

import { useState, useEffect, useMemo } from 'react';
import { db, ReadingHistory, UserGoal } from '@/lib/dexie';
import { authClient } from '@/lib/auth-client';
import { useSurahs } from './use-quran-data';

export function useStats() {
    const { data: session } = authClient.useSession();
    const { surahs } = useSurahs();
    const [history, setHistory] = useState<ReadingHistory[]>([]);
    const [goal, setGoal] = useState<UserGoal | null>(null);
    const [totalAyahsRead, setTotalAyahsRead] = useState(0);

    const userId = session?.user?.id || 'guest';

    useEffect(() => {
        async function load() {
            const h = await db.readingHistory.where('userId').equals(userId).toArray();
            setHistory(h);

            const g = await db.userGoals.get(userId);
            setGoal(g || null);

            // Calculate total ayahs read from progress (this is slightly complex if we only have history)
            // For now, let's sum history ayahCount. 
            // Note: This only counts ayahs read while the feature is active.
            const total = h.reduce((acc, curr) => acc + curr.ayahCount, 0);
            setTotalAyahsRead(total);
        }
        load();
    }, [userId]);

    const totalQuranAyahs = useMemo(() => {
        return surahs.reduce((acc, s) => acc + s.jumlahAyat, 0) || 6236;
    }, [surahs]);

    const stats = useMemo(() => {
        if (history.length === 0) return {
            streak: 0,
            completionPercentage: 0,
            todayCount: 0,
            weeklyActivity: [],
            predictedKhatamDate: null
        };

        // 1. Calculate Streak
        let streak = 0;
        const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let checkDate = today;
        const historyMap = new Map(history.map(h => [h.date, h]));

        if (!historyMap.has(today) && !historyMap.has(yesterday)) {
            streak = 0;
        } else {
            if (!historyMap.has(today)) checkDate = yesterday;

            let tempDate = new Date(checkDate);
            while (true) {
                const dateString = tempDate.toISOString().split('T')[0];
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
            const d = new Date(Date.now() - i * 86400000);
            const ds = d.toISOString().split('T')[0];
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
            const daysDiff = Math.max(Math.ceil((Date.now() - firstDate.getTime()) / 86400000), 1);
            const avgPerDay = totalAyahsRead / daysDiff;

            if (avgPerDay > 0) {
                const ayahsLeft = totalQuranAyahs - totalAyahsRead;
                const daysLeft = Math.ceil(ayahsLeft / avgPerDay);
                predictedKhatamDate = new Date(Date.now() + daysLeft * 86400000);
            }
        }

        return {
            streak,
            completionPercentage,
            todayCount: historyMap.get(today)?.ayahCount || 0,
            weeklyActivity,
            predictedKhatamDate
        };
    }, [history, totalAyahsRead, totalQuranAyahs]);

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

    return { ...stats, goal, totalAyahsRead, totalQuranAyahs, setKhatamTarget };
}
