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

export function useSurahDetail(nomor: number) {
    const [surah, setSurah] = useState<SurahDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!nomor) return;

        async function fetchDetail() {
            try {
                setLoading(true);
                // 1. Check local Dexie DB
                const localSurah = await db.surahDetails.get(nomor);
                if (localSurah) {
                    setSurah(localSurah);
                    setLoading(false);
                    return;
                }

                // 2. Fetch from API
                const res = await fetch(`${API_BASE_URL}/surat/${nomor}`);
                if (!res.ok) throw new Error(`Failed to fetch surah ${nomor}`);

                const json: QuranResponse<SurahDetail> = await res.json();

                // 3. Save to Dexie and state
                if (json.data) {
                    // Add nomor explicitly as primary key if not mapped perfectly by Dexie though we used 'nomor'
                    await db.surahDetails.put(json.data);
                    setSurah(json.data);
                }
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
