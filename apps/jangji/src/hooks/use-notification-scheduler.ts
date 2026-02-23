'use client';

import { useEffect, useCallback } from 'react';
import { usePrayerTimes } from './use-prayer-times';
import {
    getNotificationSettings,
    sendLocalNotification,
    shouldNotify,
    PrayerName
} from '@/lib/notification-utils';

const LAST_NOTIFIED_KEY = 'jangji_last_notified';

export function useNotificationScheduler() {
    const { data: prayerTimes } = usePrayerTimes();

    const checkAndNotify = useCallback(async () => {
        if (!prayerTimes || typeof window === 'undefined') return;

        const settings = getNotificationSettings();
        if (!settings.enabled) return;

        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeString = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
        const todayDate = now.toDateString();

        const prayers: { name: PrayerName; time: string }[] = [
            { name: 'Imsak', time: prayerTimes.timings.Imsak },
            { name: 'Fajr', time: prayerTimes.timings.Fajr },
            { name: 'Dhuhr', time: prayerTimes.timings.Dhuhr },
            { name: 'Asr', time: prayerTimes.timings.Asr },
            { name: 'Maghrib', time: prayerTimes.timings.Maghrib },
            { name: 'Isha', time: prayerTimes.timings.Isha },
        ];

        // Get last notified prayer from storage
        const lastNotifiedRaw = localStorage.getItem(LAST_NOTIFIED_KEY);
        const lastNotified = lastNotifiedRaw ? JSON.parse(lastNotifiedRaw) : { date: '', prayer: '' };

        for (const prayer of prayers) {
            // If it's exactly the prayer time
            if (prayer.time === currentTimeString) {
                // If we haven't notified for this prayer today
                if (lastNotified.date !== todayDate || lastNotified.prayer !== prayer.name) {
                    if (shouldNotify(prayer.name)) {
                        const label = prayer.name === 'Fajr' ? 'Subuh' : prayer.name === 'Dhuhr' ? 'Dzuhur' : prayer.name === 'Asr' ? 'Ashar' : prayer.name;

                        await sendLocalNotification(
                            `Waktu ${label} Tiba`,
                            `Saatnya menunaikan ibadah ${label} untuk wilayah ${localStorage.getItem('jangji_location_name') || 'Anda'}.`
                        );

                        // Save last notified
                        localStorage.setItem(LAST_NOTIFIED_KEY, JSON.stringify({
                            date: todayDate,
                            prayer: prayer.name
                        }));
                    }
                }
                break;
            }
        }
    }, [prayerTimes]);

    useEffect(() => {
        // Initial check
        checkAndNotify();

        // Check every 30 seconds to catch the exact minute
        const interval = setInterval(checkAndNotify, 30000);
        return () => clearInterval(interval);
    }, [checkAndNotify]);
}
