'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Ensure component is mounted to avoid hydration mismatch
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return <div className="h-10 w-10 rounded-xl bg-secondary/50" />;
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 text-primary transition-all hover:bg-secondary hover:scale-105 active:scale-95 dark:bg-secondary/20"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {isDark ? (
                <Sun className="h-5 w-5" />
            ) : (
                <Moon className="h-5 w-5" />
            )}
        </button>
    );
}
