export interface JuzMapping {
    juz: number;
    surah: number;
    ayah: number;
}

export const juzMappings: JuzMapping[] = [
    { juz: 1, surah: 1, ayah: 1 },
    { juz: 2, surah: 2, ayah: 142 },
    { juz: 3, surah: 2, ayah: 253 },
    { juz: 4, surah: 3, ayah: 93 },
    { juz: 5, surah: 4, ayah: 24 },
    { juz: 6, surah: 4, ayah: 148 },
    { juz: 7, surah: 5, ayah: 82 },
    { juz: 8, surah: 6, ayah: 111 },
    { juz: 9, surah: 7, ayah: 88 },
    { juz: 10, surah: 8, ayah: 41 },
    { juz: 11, surah: 9, ayah: 93 },
    { juz: 12, surah: 11, ayah: 6 },
    { juz: 13, surah: 12, ayah: 53 },
    { juz: 14, surah: 15, ayah: 1 },
    { juz: 15, surah: 17, ayah: 1 },
    { juz: 16, surah: 18, ayah: 75 },
    { juz: 17, surah: 21, ayah: 1 },
    { juz: 18, surah: 23, ayah: 1 },
    { juz: 19, surah: 25, ayah: 21 },
    { juz: 20, surah: 27, ayah: 56 },
    { juz: 21, surah: 29, ayah: 46 },
    { juz: 22, surah: 33, ayah: 31 },
    { juz: 23, surah: 35, ayah: 23 },
    { juz: 24, surah: 39, ayah: 32 },
    { juz: 25, surah: 41, ayah: 47 },
    { juz: 26, surah: 46, ayah: 1 },
    { juz: 27, surah: 51, ayah: 31 },
    { juz: 28, surah: 58, ayah: 1 },
    { juz: 29, surah: 67, ayah: 1 },
    { juz: 30, surah: 78, ayah: 1 },
];

export function getJuzNumber(surahNomor: number, ayahNomor: number): number {
    // We iterate backwards from Juz 30 to 1
    for (let i = juzMappings.length - 1; i >= 0; i--) {
        const mapping = juzMappings[i];
        if (surahNomor > mapping.surah) {
            return mapping.juz;
        } else if (surahNomor === mapping.surah && ayahNomor >= mapping.ayah) {
            return mapping.juz;
        }
    }
    return 1;
}

export function getJuzInfo(juzNumber: number) {
    const start = juzMappings.find(m => m.juz === juzNumber);
    const next = juzMappings.find(m => m.juz === juzNumber + 1);

    return {
        start: start!,
        end: next ? { surah: next.surah, ayah: next.ayah - 1 } : { surah: 114, ayah: 6 } // Simplified end for Juz 30
    };
}

// Map of how many Ayat in each Surah (needed for Juz transitions)
// This is a simplified version, ideally we get this from the API or a full static map.
// For now, we'll use it to know which Surahs are involved in a Juz.
export function getSurahsInJuz(juzNumber: number): number[] {
    const startSurah = juzMappings[juzNumber - 1].surah;
    const endSurah = juzNumber < 30 ? juzMappings[juzNumber].surah : 114;

    const surahs = [];
    for (let i = startSurah; i <= endSurah; i++) {
        surahs.push(i);
    }
    return surahs;
}
