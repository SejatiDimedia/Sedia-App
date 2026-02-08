import { Inter, Outfit } from "next/font/google";
import Link from "next/link";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata = {
    title: "Sedia Catalog",
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
        <div className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-gradient-to-b from-zinc-50 to-white`}>
            {/* Premium Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-zinc-100/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/catalog" className="flex items-center group">
                        <div className="relative flex items-center">
                            <span className="font-outfit font-black text-2xl tracking-tighter text-zinc-950 transition-all duration-300 group-hover:text-teal-600">
                                Sedia
                            </span>
                            <div className="ml-1.5 px-2 py-1 bg-zinc-950 rounded-lg transform -rotate-2 group-hover:rotate-0 group-hover:scale-110 transition-all duration-300 shadow-[3px_3px_0px_0px_rgba(20,184,166,0.4)]">
                                <span className="text-[10px] font-mono font-black text-white uppercase tracking-[0.2em] leading-none block">
                                    Catalog
                                </span>
                            </div>
                            <div className="ml-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 group-hover:scale-150 transition-all duration-300"></div>
                        </div>
                    </Link>
                </div>
            </header>

            <main className="min-h-[calc(100vh-64px)]">
                {children}
            </main>

            <footer className="bg-white border-t border-zinc-100 py-6">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-xs text-zinc-400">Powered by Sedia POS</p>
                </div>
            </footer>
        </div>
    );
}
