import { Inter, Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "@/app/globals.css";
import KatsiraLogo from "@/components/KatsiraLogo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata = {
    title: "Katsira Catalog",
    description: "Browse our menu and products",
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function CatalogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`${inter.variable} ${plusJakarta.variable} ${playfair.variable} font-sans min-h-screen bg-zinc-50`}>
            {/* Minimalist Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200/50 sticky top-0 z-50 supports-[backdrop-filter]:bg-white/60 h-14 md:h-16">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-center md:justify-between">
                    <Link href="/catalog" className="relative flex items-center group select-none py-4 px-2">
                        <KatsiraLogo size={42} />
                    </Link>
                </div>
            </header>

            <main className="min-h-[calc(100vh-64px)]">
                {children}
            </main>

            <footer className="bg-white border-t border-zinc-100 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm font-medium text-zinc-400">
                        Powered By <span className="text-zinc-900 font-bold">Katsira</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}
