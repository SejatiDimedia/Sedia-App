export type PrayerName = 'Imsak' | 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export interface NotificationSettings {
    enabled: boolean;
    prayers: Record<PrayerName, boolean>;
}

const STORAGE_KEY = 'jangji_notification_settings';

const DEFAULT_SETTINGS: NotificationSettings = {
    enabled: false,
    prayers: {
        Imsak: false,
        Fajr: true,
        Dhuhr: true,
        Asr: true,
        Maghrib: true,
        Isha: true,
    }
};

/**
 * Get notification settings from local storage
 */
export function getNotificationSettings(): NotificationSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    try {
        return JSON.parse(stored);
    } catch {
        return DEFAULT_SETTINGS;
    }
}

/**
 * Save notification settings to local storage
 */
export function saveNotificationSettings(settings: NotificationSettings) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    return await Notification.requestPermission();
}

/**
 * Send a local notification
 */
export async function sendLocalNotification(title: string, body: string) {
    if (typeof window === 'undefined') return;

    if (Notification.permission !== 'granted') return;

    // Use ServiceWorker if available for better PWA support
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
            registration.showNotification(title, {
                body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                vibrate: [200, 100, 200],
                tag: 'jangji-prayer-alert',
                renotify: true,
                data: {
                    url: window.location.origin + '/sholat'
                }
            } as any);
            return;
        }
    }

    // Fallback to standard Notification
    new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
    });
}

/**
 * Check if a prayer notification should be sent based on current settings
 */
export function shouldNotify(prayerName: string): boolean {
    const settings = getNotificationSettings();
    if (!settings.enabled) return false;
    return settings.prayers[prayerName as PrayerName] || false;
}
