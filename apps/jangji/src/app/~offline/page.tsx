'use client';

import { WifiOff, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary/30 text-primary">
                <WifiOff className="h-10 w-10" />
            </div>

            <h1 className="mb-2 text-2xl font-bold text-foreground">Kamu sedang Offline</h1>
            <p className="mb-8 max-w-xs text-muted-foreground">
                Sepertinya koneksi internet kamu terputus. Jangan khawatir, kamu masih bisa membaca surat yang sudah pernah kamu buka sebelumnya.
            </p>

            <div className="flex flex-col w-full max-w-xs gap-3">
                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                >
                    <RefreshCw className="h-4 w-4" />
                    Coba Lagi
                </button>

                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3 font-bold text-primary transition-all hover:bg-secondary/80"
                >
                    <Home className="h-4 w-4" />
                    Ke Dashboard
                </Link>
            </div>

            <div className="absolute bottom-12">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                    Jangji - Jejak Ngaji
                </p>
            </div>
        </div>
    );
}
