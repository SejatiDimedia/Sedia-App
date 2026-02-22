'use client';

import { useEffect } from 'react';

export default function PWARegistry() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // next-pwa registers it automatically, we just log the status here
            navigator.serviceWorker.ready.then((registration) => {
                console.log('Jangji PWA: Active and Ready!', registration.scope);
            });
        }
    }, []);

    return null;
}
