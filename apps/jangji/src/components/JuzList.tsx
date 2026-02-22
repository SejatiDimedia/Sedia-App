'use client';

import Link from 'next/link';
import { getJuzInfo, juzMappings } from '@/lib/quran-utils';

export default function JuzList() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {juzMappings.map((mapping) => {
                const info = getJuzInfo(mapping.juz);
                return (
                    <Link
                        key={mapping.juz}
                        href={`/juz/${mapping.juz}`}
                        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-secondary/30 bg-white p-4 transition-all hover:border-primary hover:shadow-md dark:bg-white/5"
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-lg font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors dark:bg-secondary/20">
                            {mapping.juz}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h3 className="font-bold text-foreground transition-colors group-hover:text-primary">
                                Juz {mapping.juz}
                            </h3>
                            <p className="text-xs text-muted-foreground opacity-70 truncate">
                                Mulai dari Surah {mapping.surah} (Ayat {mapping.ayah})
                            </p>
                        </div>
                        <div className="text-2xl font-arabic text-primary/30 group-hover:text-primary/60 transition-colors">
                            جزء {mapping.juz}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
