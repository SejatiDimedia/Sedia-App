import SurahReader from '@/components/SurahReader';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { UserAuthMenu } from '@/components/auth/UserAuthMenu';

// Optional: Provide generateStaticParams if we want to pre-render the paths.
// But since data is client-side/Dexie driven, we can just use dynamic client fetching.

export default async function SurahPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = await params;
    const surahId = parseInt(resolvedParams.id, 10);

    if (isNaN(surahId) || surahId < 1 || surahId > 114) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
                <div>
                    <h1 className="mb-4 text-2xl font-bold">Surat Tidak Ditemukan</h1>
                    <Link href="/" className="text-primary hover:underline">
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors dark:bg-background/95">
            <header className="sticky top-0 z-10 w-full border-b border-secondary/30 bg-background/80 py-4 backdrop-blur-md dark:bg-background/80">
                <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                        <span className="font-semibold">Kembali</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <UserAuthMenu />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 sm:px-6">
                <SurahReader nomor={surahId} />
            </main>
        </div>
    );
}
