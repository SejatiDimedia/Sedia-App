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
                const userId = session.user.id;
                const localData = await db.localProgress.get(userId) || null;
                const result = await syncProgress(localData);

                // If the server returned data, we should update/init local state
                if (result.success && result.data) {
                    const serverData = result.data;

                    // Logic: 
                    // 1. If we don't have local data yet (new device), adopt server data
                    // 2. If server data is strictly newer than local data, adopt server data
                    const shouldAdoptServer = !localData || serverData.lastReadAt > localData.lastReadAt;

                    if (shouldAdoptServer) {
                        await db.localProgress.put({
                            ...serverData,
                            id: userId // Ensure ID matches the current user
                        });
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
