'use client';

import { Settings2, Languages, Brain, Sun, Moon, Check, CheckCircle2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface ReaderSettingsProps {
    mushafMode: boolean;
    toggleMushafMode: () => void;
    hapalanMode: boolean;
    toggleHapalanMode: () => void;
}

export function ReaderSettings({
    mushafMode,
    toggleMushafMode,
    hapalanMode,
    toggleHapalanMode
}: ReaderSettingsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { resolvedTheme, setTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${isOpen
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-secondary/80 text-primary hover:bg-secondary dark:bg-secondary/20'
                    }`}
                title="Setelan Baca"
            >
                <Settings2 className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <div className={`absolute right-0 top-full pt-2 transition-all duration-200 z-50 ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}>
                <div className="w-56 overflow-hidden rounded-2xl border border-secondary/30 bg-white p-1.5 shadow-2xl dark:bg-background/95 dark:backdrop-blur-md">
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary/50 border-b border-secondary/10 mb-1">
                        Setelan Baca
                    </div>

                    {/* Mushaf Mode */}
                    <button
                        onClick={toggleMushafMode}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${mushafMode
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-secondary/50'
                            }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Languages className="h-4 w-4" />
                            <span>Mode Mushaf</span>
                        </div>
                        {mushafMode && <CheckCircle2 className="h-4 w-4 fill-primary text-white" />}
                    </button>

                    {/* Hapalan Mode */}
                    <button
                        onClick={toggleHapalanMode}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${hapalanMode
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-secondary/50'
                            }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Brain className="h-4 w-4" />
                            <span>Mode Hapalan</span>
                        </div>
                        {hapalanMode && <CheckCircle2 className="h-4 w-4 fill-primary text-white" />}
                    </button>

                    <div className="my-1.5 h-px bg-secondary/10" />

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold text-muted-foreground transition-all hover:bg-secondary/50"
                    >
                        <div className="flex items-center gap-2.5">
                            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            <span>Mode {isDark ? 'Terang' : 'Gelap'}</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
