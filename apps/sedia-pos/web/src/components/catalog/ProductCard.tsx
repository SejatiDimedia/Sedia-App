"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ShoppingBag, Package, Tag } from "lucide-react";

interface Variant {
    id: string;
    name: string;
    priceAdjustment: string | null;
    stock: number | null;
    isActive: boolean | null;
}

interface ProductCardProps {
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string | null;
    category?: string;
    isActive: boolean;
    primaryColor: string;
    variants?: Variant[];
    onClick?: () => void;
}

export function ProductCard({
    name,
    price,
    stock,
    imageUrl,
    category,
    primaryColor,
    variants,
    onClick
}: ProductCardProps) {
    const isOutOfStock = stock <= 0;
    const isLowStock = stock > 0 && stock <= 5;
    const hasVariants = variants && variants.length > 0;

    // Calculate minimum price (base price + smallest adjustment)
    const minPrice = hasVariants
        ? Math.min(...variants.map(v => price + parseFloat(v.priceAdjustment || "0")))
        : price;

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative bg-white rounded-3xl overflow-hidden transition-all duration-500 h-full flex flex-col",
                "shadow-[0_2px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]",
                "hover:-translate-y-2 cursor-pointer",
                isOutOfStock && "opacity-60 pointer-events-none"
            )}>
            {/* Image Container */}
            <div className="relative w-full aspect-square md:aspect-[3/4] overflow-hidden bg-gradient-to-br from-zinc-100 via-zinc-50 to-white">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        className={cn(
                            "object-cover transition-all duration-700 group-hover:scale-110",
                            isOutOfStock && "grayscale"
                        )}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-100">
                        <div className="text-center">
                            <Package className="w-16 h-16 text-zinc-300 group-hover:scale-110 transition-transform duration-500" />
                            <span className="text-xs text-zinc-400 mt-2 block font-medium">No Image</span>
                        </div>
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Category Badge - Top Left */}
                {category && (
                    <div className="absolute top-2 left-2 md:top-3 md:left-3 z-10 max-w-[80%] md:max-w-[85%]">
                        <span
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 md:px-2.5 md:py-1.5 text-[8px] md:text-[10px] font-bold capitalize leading-tight tracking-wide text-white shadow-lg backdrop-blur-md whitespace-normal text-left"
                            style={{ backgroundColor: `${primaryColor}CC` }} // CC = 80% opacity
                        >
                            <Tag className="w-2.5 h-2.5 md:w-3 md:h-3 stroke-[3]" />
                            {category.toLowerCase()}
                        </span>
                    </div>
                )}

                {/* Status Badges - Top Right */}
                <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                    {isOutOfStock && (
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500 text-white shadow-lg backdrop-blur-md">
                            Habis
                        </span>
                    )}
                </div>

                {/* Low Stock Badge - Bottom Right */}
                {isLowStock && !isOutOfStock && (
                    <div className="absolute bottom-2 right-2 z-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <span className="relative flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg border border-white/20 overflow-hidden">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                            </span>
                            Hampir Habis
                        </span>
                    </div>
                )}

                {/* Quick Add Button - Shows on Hover (Desktop) */}
                {!isOutOfStock && (
                    <div className="absolute bottom-12 right-2 z-20 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 hidden md:block">
                        <button
                            className="w-10 h-10 rounded-full flex items-center justify-center shadow-xl text-white transition-transform hover:scale-110 active:scale-95"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <ShoppingBag className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-2.5 md:p-4 flex flex-col flex-1 relative">
                {/* Decorative Line */}
                <div
                    className="absolute top-0 left-4 right-4 h-[2px] rounded-full opacity-20"
                    style={{ backgroundColor: primaryColor }}
                />

                {/* Name */}
                <h3 className="font-bold text-zinc-900 text-base leading-snug line-clamp-2 mb-2 group-hover:text-zinc-700 transition-colors">
                    {name}
                </h3>

                {/* Variants Preview */}
                {variants && variants.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {variants.map(v => (
                            <span key={v.id} className="text-[10px] px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-md font-medium">
                                {v.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Stock Info */}
                <div className={cn(
                    "flex items-center gap-1 mb-1.5 md:mb-3 text-[9px] md:text-xs font-medium",
                    isOutOfStock ? "text-red-500" : isLowStock ? "text-amber-600" : "text-emerald-600"
                )}>
                    <Package className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    <span>
                        {isOutOfStock
                            ? "Stok Habis"
                            : isLowStock
                                ? `Sisa ${stock} item`
                                : hasVariants
                                    ? `Tersedia dalam ${variants.length} pilihan`
                                    : `Stok: ${stock} tersedia`
                        }
                    </span>
                </div>

                {/* Price */}
                <div className="mt-auto flex items-end justify-between pt-3 border-t border-zinc-100">
                    <div>
                        <span className="text-[9px] md:text-[10px] text-zinc-400 uppercase tracking-wider font-medium block mb-0.5">
                            {hasVariants ? "Mulai dari" : "Harga"}
                        </span>
                        <span
                            className="text-base md:text-xl font-black tracking-tight"
                            style={{ color: primaryColor }}
                        >
                            Rp {minPrice.toLocaleString("id-ID")}
                        </span>
                    </div>

                    {/* Mobile Add Button */}
                    {!isOutOfStock && (
                        <button
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md text-white transition-transform hover:scale-110 active:scale-95 lg:hidden"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
