'use client';

import { useNotificationScheduler } from '@/hooks/use-notification-scheduler';

export default function GlobalScheduler() {
    useNotificationScheduler();
    return null; // This component doesn't render anything visual
}
