import Link from "next/link";
import { MapPin, Phone, ArrowRight, Clock, Store } from "lucide-react";
import { slugify } from "@/utils/slug";
import { getStoreStatus } from "@/utils/store-status";

interface OutletCardProps {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    openTime?: string | null;
    closeTime?: string | null;
}

export function OutletCard({
    id,
    name,
    address,
    phone,
    primaryColor = "#2e6a69", // Default teal
    secondaryColor = "#f2b30c", // Default gold
    openTime,
    closeTime,
}: OutletCardProps) {
    const { isOpen } = getStoreStatus(openTime, closeTime);

    return (
        <Link href={`/catalog/${slugify(name)}`} className="group block h-full">
            <div className="bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-500 h-full flex flex-col relative overflow-hidden">
                {/* Decorative Brand Accent */}
                <div
                    className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-[0.03] transition-transform duration-700 group-hover:scale-150"
                    style={{ backgroundColor: primaryColor || "#2e6a69" }}
                />

                <div className="flex-1 flex flex-col relative z-10">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-sm"
                            style={{
                                background: `linear-gradient(135deg, ${(primaryColor || "#2e6a69")}10, ${(primaryColor || "#2e6a69")}25)`,
                                border: `1px solid ${(primaryColor || "#2e6a69")}20`
                            }}
                        >
                            <Store className="w-6 h-6" style={{ color: primaryColor || "#2e6a69" }} />
                        </div>

                        {openTime && closeTime && (
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5 ${isOpen ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                                {isOpen ? "Buka" : "Tutup"}
                            </div>
                        )}
                    </div>

                    <h3 className="text-xl font-brand font-black text-zinc-900 group-hover:text-zinc-700 transition-colors line-clamp-1 mb-2">
                        {name}
                    </h3>

                    {address && (
                        <div className="flex items-start gap-2 text-zinc-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-zinc-400" />
                            <span>{address}</span>
                        </div>
                    )}

                    <div className="mt-auto pt-5 flex items-center justify-between border-t border-zinc-50">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">
                                Layanan
                            </span>
                            <span className="text-sm font-semibold text-zinc-600">
                                Katalog Menu
                            </span>
                        </div>

                        <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 group-hover:shadow-md"
                            style={{
                                backgroundColor: (primaryColor || "#2e6a69"),
                                color: "#fff"
                            }}
                        >
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
