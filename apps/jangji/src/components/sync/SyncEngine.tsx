'use client';

import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { syncProgress } from '@/actions/sync';
import { db } from '@/lib/dexie';

export function SyncEngine() {
    const { data: session } = authClient.useSession();

    useEffect(() => {
        // Cannot sync if not logged in
        if (!session?.user?.id) return;

        const performSync = async () => {
            try {
                const localData = await db.localProgress.get('default') || null;
                const result = await syncProgress(localData);

                // If the server indicated it had strictly newer data, reflect it locally 
                // to maintain state consistency across devices.
                if (result.success && result.data && localData) {
                    if (result.data.lastReadAt > localData.lastReadAt) {
                        await db.localProgress.put(result.data);
                    }
                }
            } catch (err) {
                console.warn("Sync failed, will retry later:", err);
            }
        };

        // 1. Sync on page load or session change
        performSync();

        // 2. Sync when browser detects network is back online
        const handleOnline = () => performSync();
        window.addEventListener('online', handleOnline);

        // 3. Sync immediately after a user marks a progress locally
        const handleProgressUpdate = () => {
            if (navigator.onLine) {
                performSync();
            }
        };
        window.addEventListener('jangji-progress-updated', handleProgressUpdate);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('jangji-progress-updated', handleProgressUpdate);
        };
    }, [session]);

    return null; // Transparent background service
}
