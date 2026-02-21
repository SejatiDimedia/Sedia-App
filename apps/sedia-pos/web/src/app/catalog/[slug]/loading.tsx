import { ProductGridSkeleton } from "@/components/catalog/ProductCardSkeleton";

export default function CatalogLoading() {
    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Header Skeleton */}
            <div className="sticky top-14 md:top-16 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-5">
                            {/* Logo Skeleton */}
                            <div className="w-16 h-16 rounded-2xl bg-zinc-100 overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                            </div>
                            <div className="space-y-2">
                                {/* Name Skeleton */}
                                <div className="h-7 w-48 bg-zinc-100 rounded-lg overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                                </div>
                                {/* Address Skeleton */}
                                <div className="h-4 w-32 bg-zinc-100 rounded-lg overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                                </div>
                            </div>
                        </div>
                        {/* Search Bar Skeleton */}
                        <div className="w-full md:w-[420px] h-12 bg-zinc-100 rounded-2xl overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Filter Skeleton */}
            <div className="sticky top-[7.5rem] md:top-[8.5rem] z-20 bg-white/80 backdrop-blur-md border-b border-zinc-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-2 py-3 overflow-hidden">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-9 rounded-full bg-zinc-100 overflow-hidden relative shrink-0"
                                style={{ width: `${60 + Math.random() * 40}px` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Product Grid Skeleton */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="h-6 w-36 bg-zinc-100 rounded-lg overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                    </div>
                    <div className="h-4 w-16 bg-zinc-100 rounded overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                    </div>
                </div>
                <ProductGridSkeleton count={8} />
            </div>
        </div>
    );
}
