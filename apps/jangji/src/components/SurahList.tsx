'use client';

import Link from '@/components/OfflineLink';
import { useSurahs } from '@/hooks/use-quran-data';
import { getJuzNumber } from '@/lib/quran-utils';

export default function SurahList() {
    const { surahs, loading, error } = useSurahs();

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center text-red-500">
                <p>Gagal memuat data surat: {error.message}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 rounded bg-primary px-4 py-2 text-white"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {surahs.map((surah) => (
                <Link
                    key={surah.nomor}
                    href={`/surah/${surah.nomor}`}
                    className="group flex flex-col justify-between rounded-xl border border-secondary/50 bg-white p-4 shadow-sm transition-all hover:border-primary hover:shadow-md dark:bg-white/5"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary dark:bg-secondary/20">
                                {surah.nomor}
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                                    {surah.namaLatin}
                                </h3>
                                <p className="text-xs text-muted-foreground opacity-70">
                                    {surah.arti} • {surah.jumlahAyat} Ayat • Juz {getJuzNumber(surah.nomor, 1)}
                                </p>
                            </div>
                        </div>
                        <div className="font-arabic text-xl text-primary opacity-90 font-bold">
                            {surah.nama}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
