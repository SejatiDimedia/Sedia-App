'use client';

import { useState } from 'react';
import { DOA_DATA, DoaItem } from '@/lib/data-doa';
import { Search, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DoaList() {
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const filteredDoa = DOA_DATA.filter(doa =>
        doa.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doa.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCopy = (doa: DoaItem) => {
        const textToCopy = `${doa.title}\n\n${doa.arabic}\n\n${doa.latin}\n\nArtinya: ${doa.translation}\n\nSumber: Jangji App`;
        navigator.clipboard.writeText(textToCopy);
        setCopiedId(doa.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Cari doa harian..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-secondary/30 border border-primary/20 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                />
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredDoa.length > 0 ? (
                    filteredDoa.map((doa) => (
                        <motion.div
                            layout
                            key={doa.id}
                            className="bg-secondary/30 border border-primary/10 rounded-[2.5rem] p-7 sm:p-9 hover:shadow-md transition-all group relative overflow-hidden"
                        >
                            {/* Decorative Background Arabic Pattern (Very subtle) */}
                            <div className="absolute -right-4 -bottom-4 opacity-[0.02] pointer-events-none select-none">
                                <span className="font-arabic text-[100px] leading-none text-primary">دعا</span>
                            </div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/10">
                                    {doa.category}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleCopy(doa)}
                                        className="p-2 rounded-xl bg-background border border-secondary text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all"
                                    >
                                        {copiedId === doa.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold mb-6 text-foreground group-hover:text-primary transition-colors">
                                {doa.title}
                            </h3>

                            <div className="space-y-6">
                                <p className="text-3xl font-arabic leading-loose text-right text-foreground">
                                    {doa.arabic}
                                </p>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-primary italic leading-relaxed">
                                        {doa.latin}
                                    </p>
                                    <div className="h-px w-10 bg-primary/20"></div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        <span className="font-bold text-xs uppercase tracking-tighter mr-2 text-primary/40">Artinya:</span>
                                        {doa.translation}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-secondary/10 rounded-[2rem] border border-dashed border-primary/20">
                        <Search className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">Doa tidak ditemukan.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
