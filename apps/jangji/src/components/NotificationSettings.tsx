'use client';

import React, { useState, useEffect } from 'react';
import {
    getNotificationSettings,
    saveNotificationSettings,
    requestNotificationPermission,
    sendLocalNotification,
    PrayerName,
    NotificationSettings as ISettings
} from '@/lib/notification-utils';
import { Bell, BellOff, Settings, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationSettings() {
    const [settings, setSettings] = useState<ISettings | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

    useEffect(() => {
        setSettings(getNotificationSettings());
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
    }, []);

    const handleToggleGlobal = async () => {
        if (!settings) return;

        if (!settings.enabled && permissionStatus !== 'granted') {
            const status = await requestNotificationPermission();
            setPermissionStatus(status);
            if (status !== 'granted') return;
        }

        const newSettings = { ...settings, enabled: !settings.enabled };
        setSettings(newSettings);
        saveNotificationSettings(newSettings);

        if (newSettings.enabled) {
            sendLocalNotification('Notifikasi Aktif', 'Bapak akan menerima pengingat waktu sholat dari Jangji.');
        }
    };

    const handleTogglePrayer = (prayer: PrayerName) => {
        if (!settings) return;
        const newSettings = {
            ...settings,
            prayers: {
                ...settings.prayers,
                [prayer]: !settings.prayers[prayer]
            }
        };
        setSettings(newSettings);
        saveNotificationSettings(newSettings);
    };

    if (!settings) return null;

    const prayerLabels: Record<PrayerName, string> = {
        Imsak: 'Imsak',
        Fajr: 'Subuh',
        Dhuhr: 'Dzuhur',
        Asr: 'Ashar',
        Maghrib: 'Maghrib',
        Isha: 'Isya'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2.5rem] bg-secondary/30 dark:bg-primary/5 border border-primary/20 p-6 sm:p-8 space-y-8"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${settings.enabled ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                        {settings.enabled ? <Bell className="h-6 w-6" /> : <BellOff className="h-6 w-6" />}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Notifikasi Adzan</h3>
                        <p className="text-sm text-muted-foreground">Aktifkan pengingat waktu sholat</p>
                    </div>
                </div>
                <button
                    onClick={handleToggleGlobal}
                    className={`relative w-14 h-8 rounded-full transition-colors ${settings.enabled ? 'bg-primary' : 'bg-zinc-300'}`}
                >
                    <div className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition-transform ${settings.enabled ? 'translate-x-6 shadow-sm' : ''}`} />
                </button>
            </div>

            {permissionStatus === 'denied' && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">Izin Notifikasi Ditolak</p>
                        <p className="text-xs text-red-600/80 dark:text-red-400/80 leading-relaxed">
                            Bapak telah memblokir notifikasi di browser. Silakan ubah pengaturan browser Bapak untuk mengaktifkan fitur ini.
                        </p>
                    </div>
                </div>
            )}

            {settings.enabled && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t border-primary/10"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Settings className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pilih Waktu Sholat</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {(Object.keys(settings.prayers) as PrayerName[]).map((prayer) => (
                            <button
                                key={prayer}
                                onClick={() => handleTogglePrayer(prayer)}
                                className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${settings.prayers[prayer]
                                        ? 'bg-primary/10 border-primary text-primary font-bold'
                                        : 'bg-white/50 dark:bg-black/20 border-secondary/50 text-muted-foreground'
                                    }`}
                            >
                                <span className="text-sm">{prayerLabels[prayer]}</span>
                                {settings.prayers[prayer] && <CheckCircle className="h-4 w-4" />}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-[10px] text-muted-foreground italic">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Notifikasi mungkin tidak muncul jika browser Bapak dalam mode hemat baterai atau "Do Not Disturb".</span>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
