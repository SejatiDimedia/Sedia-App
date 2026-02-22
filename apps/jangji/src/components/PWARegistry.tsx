'use client';

import { useEffect } from 'react';

export default function PWARegistry() {
    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator &&
            (window as any).serivceWorkerRegistration === undefined
        ) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((registration) => {
                        console.log('Jangji PWA: Service Worker registered!', registration.scope);
                    })
                    .catch((error) => {
                        console.error('Jangji PWA: Registration failed:', error);
                    });
            });
        }
    }, []);

    return null;
}
