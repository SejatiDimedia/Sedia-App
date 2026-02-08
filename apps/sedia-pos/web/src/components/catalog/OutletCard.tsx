import Link from "next/link";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import { slugify } from "@/utils/slug";

interface OutletCardProps {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
}

export function OutletCard({
    id,
    name,
    address,
    phone,
    primaryColor = "#2e6a69", // Default teal
    secondaryColor = "#f2b30c", // Default gold
}: OutletCardProps) {
    return (
        <Link href={`/catalog/${slugify(name)}`} className="group block h-full">
            <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                {/* Brand Strip */}
                <div
                    className="absolute top-0 left-0 w-1.5 h-full transition-all duration-300 group-hover:w-2"
                    style={{ backgroundColor: primaryColor || "#2e6a69" }}
                />

                <div className="pl-3 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-zinc-900 group-hover:text-zinc-700 transition-colors mb-2 line-clamp-1">
                        {name}
                    </h3>

                    {address && (
                        <div className="flex items-start gap-2 text-zinc-500 text-sm mb-2 line-clamp-2">
                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{address}</span>
                        </div>
                    )}

                    {phone && (
                        <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
                            <Phone className="w-4 h-4 shrink-0" />
                            <span>{phone}</span>
                        </div>
                    )}

                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-zinc-50">
                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            Lihat Menu
                        </span>
                        <div
                            className="h-8 w-8 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1"
                            style={{ backgroundColor: (primaryColor || "#2e6a69") + "15" }} // 15 = roughly 10% opacity hex
                        >
                            <ArrowRight
                                className="w-4 h-4"
                                style={{ color: primaryColor || "#2e6a69" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
