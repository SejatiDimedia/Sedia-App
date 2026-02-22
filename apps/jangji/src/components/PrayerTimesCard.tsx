'use client';

import { useState, useEffect } from 'react';
import { usePrayerTimes, PrayerTimes } from '@/hooks/use-prayer-times';
import { MapPin, Moon, Sun, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrayerTimesCard() {
    const { data, weeklyData, loading, error, locationName, permissionGranted, requestLocation } = usePrayerTimes();
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [nextPrayerName, setNextPrayerName] = useState<string>('');
    const [currentTime, setCurrentTime] = useState<Date>(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!data) return;

        const calculateNextPrayer = () => {
            const now = new Date();
            const currentHours = now.getHours();
            const currentMinutes = now.getMinutes();
            const currentSeconds = now.getSeconds();
            const currentTotalSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

            const prayers: { name: keyof PrayerTimes; label: string; time: string }[] = [
                { name: 'Imsak', label: 'Imsak', time: data.timings.Imsak },
                { name: 'Fajr', label: 'Subuh', time: data.timings.Fajr },
                { name: 'Dhuhr', label: 'Dzuhur', time: data.timings.Dhuhr },
                { name: 'Asr', label: 'Ashar', time: data.timings.Asr },
                { name: 'Maghrib', label: 'Maghrib', time: data.timings.Maghrib },
                { name: 'Isha', label: 'Isya', time: data.timings.Isha },
            ];

            let nextPrayer = null;

            for (const prayer of prayers) {
                const [pHours, pMinutes] = prayer.time.split(':').map(Number);
                const pTotalSeconds = pHours * 3600 + pMinutes * 60;

                if (pTotalSeconds > currentTotalSeconds) {
                    nextPrayer = { ...prayer, totalSeconds: pTotalSeconds };
                    break;
                }
            }

            // If no next prayer today, Next prayer is Imsak tomorrow
            if (!nextPrayer) {
                const [pHours, pMinutes] = prayers[0].time.split(':').map(Number);
                nextPrayer = { ...prayers[0], totalSeconds: (pHours + 24) * 3600 + pMinutes * 60 };
            }

            setNextPrayerName(nextPrayer.label);

            const diffSeconds = nextPrayer.totalSeconds - currentTotalSeconds;
            const h = Math.floor(diffSeconds / 3600);
            const m = Math.floor((diffSeconds % 3600) / 60);
            const s = diffSeconds % 60;

            setTimeLeft(`-${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        };

        calculateNextPrayer();
        const interval = setInterval(calculateNextPrayer, 1000);
        return () => clearInterval(interval);

    }, [data, currentTime]);

    if (error && permissionGranted === false) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-900/10">
                <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
                <h3 className="mb-2 text-lg font-bold text-red-700 dark:text-red-400">Akses Lokasi Diperlukan</h3>
                <p className="mb-4 text-sm text-red-600/80 dark:text-red-400/80">Kami butuh izin lokasi Bapak untuk jadwal sholat yang akurat.</p>
                <button
                    onClick={requestLocation}
                    className="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors shadow-sm"
                >
                    Izinkan Lokasi
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="animate-pulse rounded-3xl bg-secondary/20 p-6 h-[200px] border border-secondary/30 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary/50" />
                    <p className="text-sm font-medium text-muted-foreground">Mencari Koordinat Langit...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="rounded-2xl border border-secondary/50 bg-white p-6 text-center shadow-lg shadow-black/5 dark:bg-zinc-900">
                <MapPin className="mx-auto mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-lg font-bold text-foreground">Jadwal Imsakiyah & Sholat</h3>
                <p className="mb-4 text-sm text-muted-foreground">Aktifkan lokasi untuk melihat jadwal harian real-time dan hitung mundur Buka Puasa / Ramadhan.</p>
                <button
                    onClick={requestLocation}
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                    Tampilkan Jadwal
                </button>
            </div>
        );
    }


    const getIsActive = (timeString: string, nextTimeString: string | null) => {
        const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const [h, m] = timeString.split(':').map(Number);
        const targetMinutes = h * 60 + m;

        let nextMinutes = 24 * 60; // default end of day
        if (nextTimeString) {
            const [nh, nm] = nextTimeString.split(':').map(Number);
            nextMinutes = nh * 60 + nm;
        }

        return nowMinutes >= targetMinutes && nowMinutes < nextMinutes;
    };

    const schedule = [
        { label: 'Imsak', time: data.timings.Imsak, icon: Moon },
        { label: 'Subuh', time: data.timings.Fajr, icon: Sun },
        { label: 'Dzuhur', time: data.timings.Dhuhr, icon: Sun },
        { label: 'Ashar', time: data.timings.Asr, icon: Sun },
        { label: 'Maghrib', time: data.timings.Maghrib, icon: Moon },
        { label: 'Isya', time: data.timings.Isha, icon: Moon },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
        >
            <div className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-white via-primary/5 to-secondary/30 shadow-xl shadow-primary/5 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-800">
                <div className="p-6 sm:p-8">
                    {/* Header: Location & Current Time */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary dark:text-primary">
                            <MapPin className="h-5 w-5" />
                            <span className="font-semibold">{locationName}</span>
                        </div>
                        <div className="text-sm font-medium text-muted-foreground bg-white/50 px-3 py-1 rounded-full border border-white/20 dark:bg-black/20">
                            {data.date.hijri.date}H
                        </div>
                    </div>

                    {/* Countdown Hero */}
                    <div className="mb-8 text-center space-y-2">
                        <p className="text-sm font-bold uppercase tracking-widest text-primary/80 dark:text-primary/60">
                            Menuju {nextPrayerName}
                        </p>
                        {timeLeft && (
                            <div className="font-arabic text-5xl font-bold tracking-tight text-foreground sm:text-6xl drop-shadow-sm flex items-center justify-center gap-1">
                                <span className="tabular-nums">{timeLeft.split(':')[0].replace('-', '')}</span>
                                <span className="text-primary/40 pb-2">:</span>
                                <span className="tabular-nums">{timeLeft.split(':')[1]}</span>
                                <span className="text-primary/40 pb-2">:</span>
                                <span className="tabular-nums text-primary text-4xl">{timeLeft.split(':')[2]}</span>
                            </div>
                        )}
                    </div>

                    {/* Schedule Timeline */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {schedule.map((slot, index) => {
                            const Icon = slot.icon;
                            const isActive = getIsActive(slot.time, schedule[index + 1]?.time || null);

                            return (
                                <div
                                    key={slot.label}
                                    className={`flex flex-col items-center p-3 rounded-2xl transition-all border ${isActive
                                        ? 'bg-primary text-white border-primary shadow-md scale-105'
                                        : 'bg-white/60 border-secondary/50 text-foreground hover:bg-white dark:bg-black/20 dark:border-white/5 dark:hover:bg-black/40'
                                        }`}
                                >
                                    <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 ${isActive ? 'text-white/90' : 'text-muted-foreground'}`}>{slot.label}</span>
                                    <span className="text-sm sm:text-base font-bold tabular-nums">
                                        {slot.time}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Weekly List */}
            {weeklyData && weeklyData.length > 1 && (
                <div className="rounded-3xl border border-secondary/30 bg-white/50 dark:bg-zinc-900/50 p-6 shadow-sm">
                    <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Jadwal 1 Minggu
                    </h4>
                    <div className="space-y-3">
                        {weeklyData.map((day, idx) => {
                            if (idx === 0) return null; // Skip today

                            // Try to cleanly get the day name
                            let dayName = day.date.gregorian.weekday.en;
                            // Basic translation to Indonesian
                            const idDays: Record<string, string> = { "Monday": "Senin", "Tuesday": "Selasa", "Wednesday": "Rabu", "Thursday": "Kamis", "Friday": "Jumat", "Saturday": "Sabtu", "Sunday": "Minggu" };
                            if (idDays[dayName]) dayName = idDays[dayName];

                            return (
                                <div key={day.date.gregorian.date} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white dark:bg-black/40 border border-secondary/50 shadow-sm gap-4 transition-all hover:border-primary/30">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-foreground text-sm">{dayName}, {day.date.readable}</span>
                                        <span className="text-xs text-muted-foreground font-medium">{day.date.hijri.date}H</span>
                                    </div>
                                    <div className="grid grid-cols-5 gap-2 sm:gap-4 text-center">
                                        <div className="flex flex-col"><span className="text-[10px] text-muted-foreground uppercase font-bold">Subuh</span><span className="text-sm font-semibold text-foreground">{day.timings.Fajr}</span></div>
                                        <div className="flex flex-col"><span className="text-[10px] text-muted-foreground uppercase font-bold">Dzuhur</span><span className="text-sm font-semibold text-foreground">{day.timings.Dhuhr}</span></div>
                                        <div className="flex flex-col"><span className="text-[10px] text-muted-foreground uppercase font-bold">Ashar</span><span className="text-sm font-semibold text-foreground">{day.timings.Asr}</span></div>
                                        <div className="flex flex-col"><span className="text-[10px] text-muted-foreground uppercase font-bold">Maghrib</span><span className="text-sm font-semibold text-foreground">{day.timings.Maghrib}</span></div>
                                        <div className="flex flex-col"><span className="text-[10px] text-muted-foreground uppercase font-bold">Isya</span><span className="text-sm font-semibold text-foreground">{day.timings.Isha}</span></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
