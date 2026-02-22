import Dexie, { type Table } from 'dexie';
import type { SurahBase, SurahDetail } from '@/types/quran';

export interface LocalProgress {
    id: string; // usually 'default' to mean current device user
    lastSurah: number;
    lastAyah: number;
    lastReadAt: number; // timestamp
    bookmarks: Array<{ surah: number; ayah: number; timestamp: number }>;
}

export class JangjiDatabase extends Dexie {
    surahs!: Table<SurahBase, number>;
    surahDetails!: Table<SurahDetail, number>;
    localProgress!: Table<LocalProgress, string>;

    constructor() {
        super('JangjiLocalDB');
        this.version(3).stores({
            surahs: 'nomor, namaLatin',
            surahDetails: 'nomor',
            localProgress: 'id',
        });
    }
}

export const db = new JangjiDatabase();
