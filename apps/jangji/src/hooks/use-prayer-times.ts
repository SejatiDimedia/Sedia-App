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
        gregorian: { date: string };
        hijri: { date: string };
    };
}

export function usePrayerTimes() {
    const [data, setData] = useState<PrayerData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [locationName, setLocationName] = useState<string>('Lokasi Anda');
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

    const fetchPrayerTimes = async (latitude: number, longitude: number) => {
        try {
            setLoading(true);
            // Method 20: Kemenag Indonesia
            const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=20`);
            if (!res.ok) throw new Error('Gagal mengambil jadwal sholat');
            const json = await res.json();

            if (json.code === 200 && json.data) {
                // Keep only the times we care about to simplify UI
                const filteredTimings: PrayerTimes = {
                    Imsak: json.data.timings.Imsak,
                    Fajr: json.data.timings.Fajr,
                    Dhuhr: json.data.timings.Dhuhr,
                    Asr: json.data.timings.Asr,
                    Maghrib: json.data.timings.Maghrib,
                    Isha: json.data.timings.Isha,
                };
                setData({ ...json.data, timings: filteredTimings });
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
                setLocationName(data.city || data.locality);
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
        loading,
        error,
        locationName,
        permissionGranted,
        requestLocation
    };
}
