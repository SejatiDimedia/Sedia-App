import { useState, useEffect } from 'react';
import { db } from '@/lib/dexie';
import type { SurahBase, SurahDetail, QuranResponse } from '@/types/quran';

const API_BASE_URL = 'https://equran.id/api/v2';

export function useSurahs() {
    const [surahs, setSurahs] = useState<SurahBase[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchSurahs() {
            try {
                // 1. Check local Dexie DB
                const localSurahs = await db.surahs.toArray();
                if (localSurahs.length > 0) {
                    setSurahs(localSurahs);
                    setLoading(false);
                    return;
                }

                // 2. Fetch from API if local DB is empty
                const res = await fetch(`${API_BASE_URL}/surat`);
                if (!res.ok) throw new Error('Failed to fetch surahs');

                const json: QuranResponse<SurahBase[]> = await res.json();

                // 3. Save to Dexie and state
                if (json.data && json.data.length > 0) {
                    await db.surahs.bulkAdd(json.data);
                    setSurahs(json.data);
                }
            } catch (err: unknown) {
                console.error('Error fetching surahs:', err);
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        }

        fetchSurahs();
    }, []);

    return { surahs, loading, error };
}

export async function fetchSurahDetail(nomor: number): Promise<SurahDetail> {
    // 1. Check local Dexie DB
    const localSurah = await db.surahDetails.get(nomor);
    if (localSurah) {
        return localSurah;
    }

    // 2. Fetch from API
    const res = await fetch(`${API_BASE_URL}/surat/${nomor}`);
    if (!res.ok) throw new Error(`Failed to fetch surah ${nomor}`);

    const json: QuranResponse<SurahDetail> = await res.json();

    // 3. Save to Dexie
    if (json.data) {
        await db.surahDetails.put(json.data);
        return json.data;
    }
    throw new Error(`No data for surah ${nomor}`);
}

export function useSurahDetail(nomor: number) {
    const [surah, setSurah] = useState<SurahDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!nomor) return;

        async function fetchDetail() {
            try {
                setLoading(true);
                const data = await fetchSurahDetail(nomor);
                setSurah(data);
            } catch (err: unknown) {
                console.error(`Error fetching surah ${nomor}:`, err);
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        }

        fetchDetail();
    }, [nomor]);

    return { surah, loading, error };
}

export function useOfflineSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentSurah, setCurrentSurah] = useState<string>('');
    const [isComplete, setIsComplete] = useState(false);

    const syncAll = async (surahList: SurahBase[]) => {
        if (isSyncing) return;
        setIsSyncing(true);
        setIsComplete(false);
        setProgress(0);

        try {
            for (let i = 0; i < surahList.length; i++) {
                const s = surahList[i];
                setCurrentSurah(s.namaLatin);

                // Fetch and save (fetchSurahDetail already handles Dexie save)
                await fetchSurahDetail(s.nomor);

                const percent = Math.round(((i + 1) / surahList.length) * 100);
                setProgress(percent);

                // Small delay to be nice to API
                if (i % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            setIsComplete(true);
        } catch (err) {
            console.error('Offline Sync Error:', err);
        } finally {
            setIsSyncing(false);
        }
    };

    return { syncAll, isSyncing, progress, currentSurah, isComplete };
}
