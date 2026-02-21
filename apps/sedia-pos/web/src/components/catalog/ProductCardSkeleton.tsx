"use client";

export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] h-full flex flex-col">
            {/* Image Skeleton */}
            <div className="relative w-full aspect-square md:aspect-[3/4] bg-zinc-100 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            </div>

            {/* Content Skeleton */}
            <div className="p-2.5 md:p-4 flex flex-col flex-1">
                {/* Title */}
                <div className="space-y-2 mb-3">
                    <div className="h-4 bg-zinc-100 rounded-lg w-[85%] overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                    </div>
                    <div className="h-4 bg-zinc-100 rounded-lg w-[55%] overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                    </div>
                </div>

                {/* Stock */}
                <div className="h-3 bg-zinc-100 rounded-lg w-[40%] mb-3 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                </div>

                {/* Price */}
                <div className="mt-auto pt-3 border-t border-zinc-100 flex items-end justify-between">
                    <div className="space-y-1.5">
                        <div className="h-2.5 bg-zinc-100 rounded w-12 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                        </div>
                        <div className="h-5 bg-zinc-100 rounded-lg w-24 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                        </div>
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-100 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5 pb-20">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}
