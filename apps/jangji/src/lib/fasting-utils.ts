export interface FastingInfo {
    isFasting: boolean;
    type?: 'Senin' | 'Kamis' | 'Ayyamul Bidh' | 'Ramadan' | 'Sunnah';
    label?: string;
    description?: string;
}

/**
 * Identifies if a given Hijri date is a recommended fasting day.
 */
export function getFastingInfo(hijriDay: number, hijriMonth: number, weekdayEn: string): FastingInfo {
    // 1. Ramadan (Month 9) - Obligatory
    if (hijriMonth === 9) {
        return {
            isFasting: true,
            type: 'Ramadan',
            label: 'Puasa Ramadan',
            description: 'Puasa wajib bagi setiap Muslim di bulan suci.'
        };
    }

    // Forbidden days to fast (Eid and Tasyrik)
    // Eid al-Fitr (1 Shawwal)
    if (hijriMonth === 10 && hijriDay === 1) return { isFasting: false };
    // Eid al-Adha (10 Dhu al-Hijjah)
    if (hijriMonth === 12 && hijriDay === 10) return { isFasting: false };
    // Tasyrik days (11, 12, 13 Dhu al-Hijjah)
    if (hijriMonth === 12 && (hijriDay === 11 || hijriDay === 12 || hijriDay === 13)) return { isFasting: false };

    // 2. Ayyamul Bidh (13, 14, 15 of every Hijri month)
    // Note: 13 Dhu al-Hijjah is already handled above as forbidden.
    if (hijriDay === 13 || hijriDay === 14 || hijriDay === 15) {
        return {
            isFasting: true,
            type: 'Ayyamul Bidh',
            label: 'Puasa Ayyamul Bidh',
            description: 'Puasa sunnah di pertengahan bulan Hijriah.'
        };
    }

    // 3. Weekly Sunnah Fasts (Monday & Thursday)
    if (weekdayEn === 'Monday') {
        return {
            isFasting: true,
            type: 'Senin',
            label: 'Puasa Senin',
            description: 'Hari di mana Rasulullah SAW dilahirkan dan wahyu diturunkan.'
        };
    }

    if (weekdayEn === 'Thursday') {
        return {
            isFasting: true,
            type: 'Kamis',
            label: 'Puasa Kamis',
            description: 'Hari di mana amalan manusia diangkat ke hadapan Allah SWT.'
        };
    }

    return { isFasting: false };
}

/**
 * Indonesian month names for Hijri calendar
 */
export const HIJRI_MONTHS_ID = [
    'Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir',
    'Jumadil Ula', 'Jumadil Akhira', 'Rajab', 'Syaban',
    'Ramadan', 'Shawwal', 'Dzulqaidah', 'Dzulhijjah'
];
