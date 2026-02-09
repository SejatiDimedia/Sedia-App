import { Inter, Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

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
        <div className={`${inter.variable} ${plusJakarta.variable} ${playfair.variable} font-sans min-h-screen bg-zinc-50`}>
            {/* Minimalist Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200/50 sticky top-0 z-50 supports-[backdrop-filter]:bg-white/60 h-14 md:h-16">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-center md:justify-between">
                    <Link href="/catalog" className="relative flex items-center group select-none py-4 px-2">
                        <div className="relative flex flex-row items-center">

                            {/* Huruf Utama: SEDIA */}
                            <span
                                className="font-brand font-black text-4xl md:text-5xl tracking-tighter leading-[0.8] transition-all duration-500 group-hover:tracking-tight group-hover:italic"
                                style={{ color: 'var(--brand-primary, #0f766e)' }}
                            >
                                Sedia
                            </span>

                            {/* Huruf Sekunder: CATALOG (Antimainstream Position) */}
                            <div className="relative ml-[-8px] md:ml-[-12px] overflow-hidden">
                                <span
                                    className="block font-brand font-bold text-lg md:text-xl uppercase tracking-[0.2em] px-2 py-0.5 transition-all duration-500 transform translate-y-0 group-hover:-translate-y-1"
                                    style={{
                                        backgroundColor: 'var(--brand-secondary, #F59E0B)',
                                        color: '#fff', // Teks putih di atas amber biar kontras modern
                                        clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' // Bentuk jajaran genjang unik
                                    }}
                                >
                                    Catalog
                                </span>
                            </div>

                            {/* Aksen Elemen Geometris */}
                            <span className="absolute -top-2 -right-4 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 animate-ping"
                                style={{ backgroundColor: '#F59E0B' }}></span>
                        </div>

                        {/* Background Glassmorphism Glow saat Hover */}
                        <span className="absolute inset-0 bg-teal-50/0 group-hover:bg-teal-50/50 -z-10 rounded-xl transition-all duration-500 scale-95 group-hover:scale-110 blur-sm"></span>
                    </Link>
                </div>
            </header>

            <main className="min-h-[calc(100vh-64px)]">
                {children}
            </main>

            <footer className="bg-white border-t border-zinc-100 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm font-medium text-zinc-400">
                        Powered By <span className="text-zinc-900 font-bold">SediaApp</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}
