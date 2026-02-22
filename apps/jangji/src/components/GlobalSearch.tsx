'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/dexie';
import type { SurahBase } from '@/types/quran';
import Link from '@/components/OfflineLink';
import { Search, X } from 'lucide-react';
import { getJuzNumber } from '@/lib/quran-utils';

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SurahBase[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const searchSurahs = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            const lowerQuery = query.toLowerCase();
            // Perform simple client-side search across offline indexedDB
            const allSurahs = await db.surahs.toArray();
            const filtered = allSurahs.filter(s =>
                s.namaLatin.toLowerCase().includes(lowerQuery) ||
                s.arti.toLowerCase().includes(lowerQuery) ||
                s.nomor.toString() === query
            );

            setResults(filtered.slice(0, 5)); // Limit to top 5 results
        };

        const debounce = setTimeout(searchSurahs, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    return (
        <div className="relative w-full max-w-sm">
            <div className="relative flex items-center">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <Search className="h-4 w-4" />
                </div>
                <input
                    type="text"
                    className="block w-full rounded-full border border-secondary/50 bg-white py-2 pl-10 pr-10 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary dark:bg-zinc-800/10 dark:text-foreground"
                    placeholder="Cari surah atau nomor..."
                    value={query}
                    onFocus={() => setIsOpen(true)}
                    onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                        }}
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {isOpen && query.trim() && (
                <div className="absolute top-full mt-2 w-full overflow-hidden rounded-xl border border-secondary/30 bg-white shadow-lg dark:bg-background z-50">
                    {results.length > 0 ? (
                        <ul className="max-h-64 overflow-y-auto py-1">
                            {results.map((surah) => (
                                <li key={surah.nomor}>
                                    <Link
                                        href={`/surah/${surah.nomor}`}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between px-4 py-2 hover:bg-secondary/20 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <div>
                                            <div className="font-semibold text-primary text-sm">{surah.namaLatin}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">{surah.arti} • Juz {getJuzNumber(surah.nomor, 1)}</div>
                                        </div>
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-medium text-primary dark:bg-secondary/20">
                                            {surah.nomor}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                            Surat tidak ditemukan.
                        </div>
                    )}
                </div>
            )}

            {/* Backdrop for closing dropdown */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
