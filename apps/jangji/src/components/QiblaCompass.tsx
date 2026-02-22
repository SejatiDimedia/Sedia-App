'use client';

import { useState, useEffect, useCallback } from 'react';
import { Compass, AlertCircle, MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

// Mecca coordinates
const KAABA_LAT = 21.422487;
const KAABA_LON = 39.826206;

export default function QiblaCompass() {
    const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
    const [heading, setHeading] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

    // Calculate Great-Circle Bearing
    const calculateQibla = (lat: number, lon: number) => {
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const toDeg = (rad: number) => (rad * 180) / Math.PI;

        const phi1 = toRad(lat);
        const phi2 = toRad(KAABA_LAT);
        const deltaLambda = toRad(KAABA_LON - lon);

        const y = Math.sin(deltaLambda);
        const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

        let qibla = toDeg(Math.atan2(y, x));
        qibla = (qibla + 360) % 360; // Normalize 0-360

        setQiblaAngle(qibla);
    };

    const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
        let currentHeading: number | null = null;

        // Use webkitCompassHeading for iOS Safari (more accurate)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((event as any).webkitCompassHeading !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            currentHeading = (event as any).webkitCompassHeading;
        }
        // Fallback for Android (requires combining alpha, beta, gamma if absolute)
        // For simplicity, we assume alpha is compass heading if absolute flag is usually true on Android
        else if (event.absolute && event.alpha !== null) {
            currentHeading = 360 - event.alpha;
        }

        if (currentHeading !== null) {
            setHeading(currentHeading);
        } else {
            // Unlikely fallback
            if (event.alpha !== null) {
                setHeading(360 - event.alpha);
            }
        }
    }, []);

    const startCompass = useCallback(async () => {
        setError(null);

        // 1. Get Location
        if (!navigator.geolocation) {
            setError('Geolocation tidak didukung di perangkat ini.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                calculateQibla(position.coords.latitude, position.coords.longitude);
            },
            () => {
                setError('Mohon izinkan akses lokasi untuk menghitung arah kiblat.');
            },
            { enableHighAccuracy: true }
        );

        // 2. Get Device Orientation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const permissionState = await (DeviceOrientationEvent as any).requestPermission();
                if (permissionState === 'granted') {
                    setPermissionGranted(true);
                    window.addEventListener('deviceorientation', handleOrientation, true);
                } else {
                    setPermissionGranted(false);
                    setError('Akses sensor orientasi ditolak. Tidak bisa menggunakan kompas.');
                }
            } catch (err) {
                console.error(err);
                setError('Gagal meminta izin sensor.');
            }
        } else {
            // Android / Non-iOS
            setPermissionGranted(true);
            window.addEventListener('deviceorientationabsolute', handleOrientation, true);
            // Fallback
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
    }, [handleOrientation]);

    useEffect(() => {
        // Detect iOS purely to show explicit button if needed (since iOS requires user click to trigger permission)
        const userAgent = window.navigator.userAgent.toLowerCase();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        // If not iOS (or older iOS), we can try to start immediately
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!/iphone|ipad|ipod/.test(userAgent) && typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
            startCompass();
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
            window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
        };
    }, [handleOrientation, startCompass]);

    // Calculate final needle rotation relative to the phone's heading
    // qiblaAngle is absolute true North, heading is where phone is pointing
    const needleRotation = (qiblaAngle !== null && heading !== null)
        ? (qiblaAngle - heading)
        : 0;

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-900/10">
                <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
                <h3 className="mb-2 text-lg font-bold text-red-700 dark:text-red-400">Gagal Memuat Kompas</h3>
                <p className="mb-4 text-sm text-red-600/80 dark:text-red-400/80">{error}</p>
                <button
                    onClick={startCompass}
                    className="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors shadow-sm"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    if (permissionGranted === null && isIOS) {
        return (
            <div className="rounded-2xl border border-secondary/50 bg-white p-6 text-center shadow-lg shadow-black/5 dark:bg-zinc-900">
                <Compass className="mx-auto mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-lg font-bold text-foreground">Akses Kompas Dibutuhkan</h3>
                <p className="mb-4 text-sm text-muted-foreground">iPhone membutuhkan izin untuk mengakses sensor kompas. Klik tombol di bawah untuk memulai.</p>
                <button
                    onClick={startCompass}
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                    Izinkan Sensor Kompas
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center space-y-8 py-8">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
                    <Navigation className="h-6 w-6 text-primary" />
                    Penunjuk Arah Kiblat
                </h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Letakkan HP secara mendatar seperti kompas. Panah jarum hijau menunjukkan arah Ka&apos;bah (Mekkah).
                </p>
            </div>

            {/* Compass UI */}
            <div className="relative h-64 w-64 md:h-80 md:w-80 rounded-full border-4 border-primary/20 bg-background shadow-2xl shadow-primary/10 flex items-center justify-center">
                {/* Outer Compass Dial (Rotates against phone's heading to keep North up) */}
                <motion.div
                    className="absolute inset-2 rounded-full border border-secondary/50"
                    animate={{ rotate: -(heading || 0) }}
                    transition={{ type: "spring", damping: 50, stiffness: 200 }}
                >
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 font-bold text-red-500">U</div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-bold text-foreground pointer-events-none">S</div>
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 font-bold text-foreground pointer-events-none">B</div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 font-bold text-foreground pointer-events-none">T</div>
                </motion.div>

                {/* Center Dot */}
                <div className="absolute h-4 w-4 rounded-full bg-primary z-20 shadow-md"></div>

                {/* Qibla Needle */}
                {qiblaAngle !== null && (
                    <motion.div
                        className="absolute inset-0 z-10"
                        animate={{ rotate: needleRotation }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    >
                        {/* Needle body */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-2 h-[45%] bg-gradient-to-t from-transparent to-primary rounded-t-full shadow-lg"></div>
                        {/* Kaaba indicator */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black dark:bg-zinc-800 border-2 border-primary/50 text-white rounded px-2 py-0.5 text-[10px] font-bold shadow-md shadow-primary/20">
                            Ka&apos;bah
                        </div>
                    </motion.div>
                )}

                {/* Loading State or Degree indicator */}
                {heading === null || qiblaAngle === null ? (
                    <div className="absolute z-30 flex flex-col items-center">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <span className="text-[10px] mt-2 text-muted-foreground font-medium">Kalibrasi...</span>
                    </div>
                ) : (
                    <div className="absolute bottom-12 z-30 flex flex-col items-center bg-background/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-secondary/50">
                        <span className="text-xl font-bold tabular-nums">
                            {Math.round(heading)}°
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 bg-secondary/30 px-4 py-2 rounded-full border border-secondary/50 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">
                    Sudut Kiblat: <span className="text-primary font-bold">{qiblaAngle ? Math.round(qiblaAngle) + '°' : '---'}</span>
                </span>
            </div>
        </div>
    );
}
