"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { Sparkles, Coffee, UtensilsCrossed, Wine, Cake, Package } from "lucide-react";

interface Category {
    id: string;
    name: string;
}

interface CategoryFilterProps {
    categories: Category[];
    primaryColor: string;
}

// Map category names to icons
const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("coffee") || lowerName.includes("kopi")) return Coffee;
    if (lowerName.includes("drink") || lowerName.includes("minuman")) return Wine;
    if (lowerName.includes("food") || lowerName.includes("makanan")) return UtensilsCrossed;
    if (lowerName.includes("bakery") || lowerName.includes("roti") || lowerName.includes("cake")) return Cake;
    return Package;
};

function CategoryFilterContent({ categories, primaryColor }: CategoryFilterProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    if (!searchParams) return null;

    const activeCategory = searchParams.get("category");

    const handleCategoryClick = (categoryId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (categoryId === "all") {
            params.delete("category");
        } else {
            params.set("category", categoryId);
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar">
                {/* All Items Button */}
                <button
                    onClick={() => handleCategoryClick("all")}
                    className={cn(
                        "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300",
                        "shadow-sm hover:shadow-lg active:scale-95 min-w-fit",
                        !activeCategory
                            ? "text-white shadow-md scale-105"
                            : "bg-white text-zinc-600 border-2 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                    )}
                    style={!activeCategory ? { backgroundColor: primaryColor } : {}}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Semua Menu</span>
                </button>

                {/* Category Buttons */}
                {categories.map((category) => {
                    const isActive = activeCategory === category.id;
                    const Icon = getCategoryIcon(category.name);

                    return (
                        <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300",
                                "shadow-sm hover:shadow-lg active:scale-95 min-w-fit",
                                isActive
                                    ? "text-white shadow-md scale-105"
                                    : "bg-white text-zinc-600 border-2 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                            )}
                            style={isActive ? { backgroundColor: primaryColor } : {}}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{category.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function CategoryFilter(props: CategoryFilterProps) {
    return (
        <div className="sticky top-[56px] z-20 bg-gradient-to-b from-white via-white to-white/90 backdrop-blur-lg border-b border-zinc-100/50 py-3">
            <Suspense fallback={
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-12 w-32 animate-pulse bg-zinc-100 rounded-2xl" />
                        ))}
                    </div>
                </div>
            }>
                <CategoryFilterContent {...props} />
            </Suspense>
        </div>
    );
}
