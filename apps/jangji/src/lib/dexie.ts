import Dexie, { type Table } from 'dexie';
import type { SurahBase, SurahDetail } from '@/types/quran';

export interface LocalProgress {
    id: string; // usually 'default' to mean current device user
    lastSurah: number;
    lastAyah: number;
    lastReadAt: number; // timestamp
    bookmarks: Array<{ surah: number; ayah: number; timestamp: number; category?: string }>;
}

export interface ReadingHistory {
    id?: number;
    userId: string;
    date: string; // YYYY-MM-DD
    ayahCount: number;
    surahsRead: number[];
}

export interface UserGoal {
    userId: string; // matches LocalProgress id
    targetKhatamDate: number;
    dailyTargetAyahs: number;
}

export class JangjiDatabase extends Dexie {
    surahs!: Table<SurahBase, number>;
    surahDetails!: Table<SurahDetail, number>;
    localProgress!: Table<LocalProgress, string>;
    readingHistory!: Table<ReadingHistory, number>;
    userGoals!: Table<UserGoal, string>;

    constructor() {
        super('JangjiLocalDB');
        this.version(4).stores({
            surahs: 'nomor, namaLatin',
            surahDetails: 'nomor',
            localProgress: 'id',
            readingHistory: '++id, [userId+date], userId, date',
            userGoals: 'userId',
        });
    }
}

export const db = new JangjiDatabase();
