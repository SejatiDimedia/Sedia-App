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
            <div className="rounded-[2rem] border border-secondary/40 bg-white dark:bg-zinc-900/80 p-8 text-center shadow-sm">
                <Compass className="mx-auto mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-xl font-bold text-foreground">Akses Kompas Dibutuhkan</h3>
                <p className="mb-6 text-sm text-muted-foreground/80 max-w-xs mx-auto">iPhone membutuhkan izin untuk mengakses sensor kompas. Klik tombol di bawah untuk memulai kalibrasi.</p>
                <button
                    onClick={startCompass}
                    className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-all shadow-md active:scale-95"
                >
                    Izinkan Sensor
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center space-y-10 py-4">
            <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
                    <Navigation className="h-6 w-6 text-primary" />
                    Penunjuk Arah Kiblat
                </h2>
                <p className="text-muted-foreground/80 text-sm max-w-[280px] mx-auto leading-relaxed">
                    Posisikan HP mendatar. Putar hingga jarum panah sejajar menunjuk ke arah Ka&apos;bah.
                </p>
            </div>

            {/* Compass UI */}
            <div className="relative h-64 w-64 md:h-80 md:w-80 rounded-full border-[6px] border-white dark:border-zinc-800 bg-secondary/10 dark:bg-zinc-900 shadow-xl shadow-black/5 flex items-center justify-center">
                {/* Outer Compass Dial (Rotates against phone's heading to keep North up) */}
                <motion.div
                    className="absolute inset-[6px] rounded-full border border-secondary/40 bg-white dark:bg-zinc-900/50 shadow-inner"
                    animate={{ rotate: -(heading || 0) }}
                    transition={{ type: "spring", damping: 50, stiffness: 200 }}
                >
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 font-bold text-red-500 text-sm">U</div>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-bold text-muted-foreground/50 text-xs pointer-events-none">S</div>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground/50 text-xs pointer-events-none">B</div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground/50 text-xs pointer-events-none">T</div>
                </motion.div>

                {/* Center Dot */}
                <div className="absolute h-3 w-3 rounded-full bg-primary z-20 shadow-sm border-2 border-white dark:border-zinc-900"></div>

                {/* Qibla Needle */}
                {qiblaAngle !== null && (
                    <motion.div
                        className="absolute inset-0 z-10"
                        animate={{ rotate: needleRotation }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    >
                        {/* Needle body */}
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-1.5 h-[40%] bg-gradient-to-t from-primary/10 to-primary rounded-t-full shadow-md"></div>
                        {/* Kaaba indicator */}
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-primary border-2 border-white dark:border-zinc-900 text-white rounded-full px-3 py-1 text-[10px] font-bold shadow-sm tracking-wider uppercase">
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
                    <div className="absolute bottom-10 z-30 flex flex-col items-center bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-secondary/30 shadow-sm">
                        <span className="text-xl font-bold tabular-nums text-foreground">
                            {Math.round(heading)}°
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-5 py-2.5 rounded-full border border-secondary/40 text-sm shadow-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground/80">
                    Arah Kiblat: <span className="text-primary font-bold ml-1">{qiblaAngle ? Math.round(qiblaAngle) + '°' : '---'}</span>
                </span>
            </div>
        </div>
    );
}
