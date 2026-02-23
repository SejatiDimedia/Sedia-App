import { useState, useEffect, useCallback } from 'react';

export interface PrayerTimes {
    Imsak: string;
    Fajr: string; // Subuh
    Dhuhr: string; // Dzuhur
    Asr: string; // Ashar
    Maghrib: string;
    Isha: string; // Isya
}

export interface PrayerData {
    timings: PrayerTimes;
    date: {
        readable: string;
        gregorian: { date: string; weekday: { en: string } };
        hijri: {
            date: string;
            day: string;
            month: { number: number; en: string; ar?: string };
            year: string;
            weekday: { en: string; ar?: string };
            holidays: string[];
        };
    };
}

export function usePrayerTimes() {
    const [data, setData] = useState<PrayerData | null>(null);
    const [weeklyData, setWeeklyData] = useState<PrayerData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [locationName, setLocationName] = useState<string>('Lokasi Anda');
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

    const fetchPrayerTimes = async (latitude: number, longitude: number) => {
        try {
            setLoading(true);
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const day = now.getDate();

            // Method 20: Kemenag Indonesia, fetch complete calendar for current month
            const res = await fetch(`https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=20`);
            if (!res.ok) throw new Error('Gagal mengambil jadwal sholat');
            const json = await res.json();

            if (json.code === 200 && Array.isArray(json.data)) {
                const todayIndex = day - 1;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let schedule = json.data.slice(todayIndex, todayIndex + 7);

                // If the 7-day window spills into the next month, fetch next month data
                if (schedule.length < 7) {
                    const nextMonthDate = new Date(year, month, 1); // automatically rolls over to next month/year
                    const nextYear = nextMonthDate.getFullYear();
                    const nextMonth = nextMonthDate.getMonth() + 1;

                    try {
                        const nextRes = await fetch(`https://api.aladhan.com/v1/calendar/${nextYear}/${nextMonth}?latitude=${latitude}&longitude=${longitude}&method=20`);
                        if (nextRes.ok) {
                            const nextJson = await nextRes.json();
                            if (nextJson.code === 200 && Array.isArray(nextJson.data)) {
                                const remainingDays = 7 - schedule.length;
                                schedule = [...schedule, ...nextJson.data.slice(0, remainingDays)];
                            }
                        }
                    } catch (e) {
                        console.error('Info: Gagal mengambil bulan berikutnya', e);
                    }
                }

                // Clean the times (remove " (WIB)")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const processDay = (dayData: any): PrayerData => ({
                    ...dayData,
                    timings: {
                        Imsak: dayData.timings.Imsak.split(' ')[0],
                        Fajr: dayData.timings.Fajr.split(' ')[0],
                        Dhuhr: dayData.timings.Dhuhr.split(' ')[0],
                        Asr: dayData.timings.Asr.split(' ')[0],
                        Maghrib: dayData.timings.Maghrib.split(' ')[0],
                        Isha: dayData.timings.Isha.split(' ')[0],
                    }
                });

                const processedSchedule = schedule.map(processDay);

                if (processedSchedule.length > 0) {
                    setData(processedSchedule[0]); // Today's data
                    setWeeklyData(processedSchedule);
                } else {
                    throw new Error('Data jadwal kosong');
                }
            } else {
                throw new Error('Format data tidak valid');
            }
        } catch (err: unknown) {
            console.error('Error fetching prayer times:', err);
            setError(err instanceof Error ? err : new Error('Terjadi kesalahan tidak terduga'));
        } finally {
            setLoading(false);
        }
    };

    const reverseGeocode = async (lat: number, lon: number) => {
        // Optional: Get city name using a free reverse geocoding API (e.g. bigdatacloud)
        try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`);
            const data = await res.json();
            if (data.city || data.locality) {
                const name = data.city || data.locality;
                setLocationName(name);
                localStorage.setItem('jangji_location_name', name);
            }
        } catch {
            console.error('Reverse geocoding failed');
        }
    };

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError(new Error('Geolocation tidak didukung di browser ini'));
            setLoading(false);
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Save to local storage to avoid spamming permission requests
                localStorage.setItem('jangji_location', JSON.stringify({ latitude, longitude }));
                setPermissionGranted(true);
                reverseGeocode(latitude, longitude);
                fetchPrayerTimes(latitude, longitude);
            },
            (err) => {
                console.warn('Geolocation error:', err.message);
                setPermissionGranted(false);
                setError(new Error('Akses lokasi ditolak. Silakan izinkan akses lokasi untuk melihat jadwal sholat akurat.'));
                setLoading(false);
            },
            { timeout: 10000, maximumAge: 3600000 } // Cache location for 1 hour
        );
    }, []);

    useEffect(() => {
        // Check for cached location first
        const cachedLocation = localStorage.getItem('jangji_location');
        if (cachedLocation) {
            try {
                const { latitude, longitude } = JSON.parse(cachedLocation);
                setPermissionGranted(true);
                reverseGeocode(latitude, longitude);
                fetchPrayerTimes(latitude, longitude);
            } catch {
                // If parse fails, request again
                requestLocation();
            }
        } else {
            // We wait for user interaction to trigger requestLocation
            setLoading(false);
        }
    }, [requestLocation]);

    return {
        data,
        weeklyData,
        loading,
        error,
        locationName,
        permissionGranted,
        requestLocation
    };
}
