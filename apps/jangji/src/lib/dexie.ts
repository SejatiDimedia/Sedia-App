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
    dailyTapCount?: number;
    surahsRead: number[];
    readAyahKeys?: string[]; // e.g. "2:255"
}

export interface UserGoal {
    userId: string; // matches LocalProgress id
    targetKhatamDate: number;
    dailyTargetAyahs: number;
}

export interface JuzCompletionEvent {
    id?: number;
    userId: string;
    juzNumber: number;
    completedAt: number; // timestamp
}

export interface ManualKhatamEvent {
    id?: number;
    userId: string;
    completedAt: number; // timestamp
    note?: string;
}

export class JangjiDatabase extends Dexie {
    surahs!: Table<SurahBase, number>;
    surahDetails!: Table<SurahDetail, number>;
    localProgress!: Table<LocalProgress, string>;
    readingHistory!: Table<ReadingHistory, number>;
    userGoals!: Table<UserGoal, string>;
    juzCompletionEvents!: Table<JuzCompletionEvent, number>;
    manualKhatamEvents!: Table<ManualKhatamEvent, number>;

    constructor() {
        super('JangjiLocalDB');
        this.version(8).stores({
            surahs: 'nomor, namaLatin',
            surahDetails: 'nomor',
            localProgress: 'id',
            readingHistory: '++id, [userId+date], userId, date',
            userGoals: 'userId',
            juzCompletionEvents: '++id, userId, completedAt, [userId+completedAt], [userId+juzNumber]',
            manualKhatamEvents: '++id, userId, completedAt, [userId+completedAt]',
        });
    }
}

export const db = new JangjiDatabase();
