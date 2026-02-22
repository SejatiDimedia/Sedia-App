"use client";

import { SyncEngine } from "@/components/sync/SyncEngine";
import { ThemeProvider } from "next-themes";
import ThemeToggle from "@/components/ThemeToggle";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SyncEngine />
            {children}
        </ThemeProvider>
    );
}
