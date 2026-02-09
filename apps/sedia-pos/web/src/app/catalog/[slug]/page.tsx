import { db, posSchema } from "@/lib/db";
import { eq, and, ilike } from "drizzle-orm";
import Link from "next/link";
import { Store, MapPin, Package, Clock } from "lucide-react";
import { getStoreStatus } from "@/utils/store-status";

import { ProductCard } from "@/components/catalog/ProductCard";
import { SearchBar } from "@/components/catalog/SearchBar";
import { CategoryFilter } from "@/components/catalog/CategoryFilter";
import { slugify } from "@/utils/slug";
import { resolveR2UrlServer } from "@/lib/storage";

// Disable caching for development - set to 60 in production
export const revalidate = 0;

async function getOutlet(slug: string) {
    const decodedSlug = decodeURIComponent(slug);
    console.log(`[Catalog] getOutlet called with slug: "${slug}", decoded: "${decodedSlug}"`);

    // 1. Try to find by UUID first (Legacy/Safe)
    const outletsById = await db
        .select()
        .from(posSchema.outlets)
        .where(eq(posSchema.outlets.id, decodedSlug))
        .limit(1);

    if (outletsById.length > 0) return outletsById[0];

    // 2. Fallback: Find by slugified name
    const allOutlets = await db.select().from(posSchema.outlets);
    const matches = allOutlets.filter(o => slugify(o.name) === decodedSlug);

    console.log(`[Catalog] Found ${matches.length} outlets matching slug "${decodedSlug}"`);

    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];

    // Multiple outlets with same name - prefer the one with products
    for (const outlet of matches) {
        const productCount = await db
            .select({ count: posSchema.products.id })
            .from(posSchema.products)
            .where(
                and(
                    eq(posSchema.products.outletId, outlet.id),
                    eq(posSchema.products.isActive, true),
                    eq(posSchema.products.isDeleted, false)
                )
            );

        console.log(`[Catalog] Outlet "${outlet.name}" (${outlet.id}) has ${productCount.length} active products`);

        if (productCount.length > 0) {
            return outlet;
        }
    }

    // If no outlet has products, return the first one
    return matches[0];
}

async function getCategories(outletId: string) {
    return await db
        .selectDistinct({
            id: posSchema.categories.id,
            name: posSchema.categories.name,
        })
        .from(posSchema.categories)
        .innerJoin(posSchema.products, eq(posSchema.products.categoryId, posSchema.categories.id))
        .where(
            and(
                eq(posSchema.products.outletId, outletId),
                eq(posSchema.products.isActive, true),
                eq(posSchema.products.isDeleted, false)
            )
        )
        .orderBy(posSchema.categories.name);
}

async function getProducts(outletId: string, search: string, categoryId: string) {
    console.log(`[Catalog] getProducts called with outletId: "${outletId}", search: "${search}", categoryId: "${categoryId}"`);

    const products = await db.query.products.findMany({
        where: and(
            eq(posSchema.products.outletId, outletId),
            eq(posSchema.products.isDeleted, false),
            eq(posSchema.products.isActive, true),
            search ? ilike(posSchema.products.name, `%${search}%`) : undefined,
            categoryId ? eq(posSchema.products.categoryId, categoryId) : undefined
        ),
        with: {
            category: true,
            variants: {
                where: eq(posSchema.productVariants.isActive, true)
            }
        },
        orderBy: (products, { asc }) => [asc(products.name)]
    });

    console.log(`[Catalog] Found ${products.length} products for outlet ${outletId}`);

    return await Promise.all(products.map(async p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        imageUrl: await resolveR2UrlServer(p.imageUrl),
        isActive: p.isActive,
        isDeleted: p.isDeleted,
        categoryName: p.category?.name || null,
        variants: p.variants
    })));
}

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ q?: string; category?: string }>;
}

export default async function CatalogPage({ params, searchParams }: PageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = searchParams ? await searchParams : {};

    const slug = resolvedParams.slug;
    const outlet = await getOutlet(slug);

    if (!outlet) {
        const allOutlets = await db.select().from(posSchema.outlets);
        return (
            <div className="p-8 max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Outlet Not Found (Debug Mode)</h1>
                <p className="mb-2">We looked for slug: <span className="font-mono bg-zinc-100 p-1 rounded">&quot;{decodeURIComponent(slug)}&quot;</span></p>

                <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden mt-6">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-4 py-2 font-medium text-zinc-600">Name</th>
                                <th className="px-4 py-2 font-medium text-zinc-600">Generated Slug</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allOutlets.map(o => (
                                <tr key={o.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                                    <td className="px-4 py-2 font-medium">{o.name}</td>
                                    <td className="px-4 py-2 font-mono text-teal-600">{slugify(o.name)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const query = resolvedSearchParams.q || "";
    const categoryId = resolvedSearchParams.category || "";

    const [products, categories] = await Promise.all([
        getProducts(outlet.id, query, categoryId),
        getCategories(outlet.id)
    ]);

    const primaryColor = outlet.primaryColor || "#2e6a69";

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50">
            {/* Premium Header */}
            <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-zinc-100/50">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-start gap-4 mb-4">
                        <Link
                            href="/catalog"
                            className="p-2.5 -ml-2 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-all duration-300 hover:scale-105 active:scale-95 mt-1"
                        >
                            <Store className="w-5 h-5" />
                        </Link>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-zinc-900 tracking-tight">{outlet.name}</h1>
                                {outlet.openTime && outlet.closeTime && (
                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStoreStatus(outlet.openTime, outlet.closeTime).isOpen ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                        <div className={`w-1 h-1 rounded-full ${getStoreStatus(outlet.openTime, outlet.closeTime).isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
                                        {getStoreStatus(outlet.openTime, outlet.closeTime).isOpen ? "Buka" : "Tutup"}
                                    </div>
                                )}
                            </div>

                            {/* Info Rows */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                {outlet.address && (
                                    <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="line-clamp-1">{outlet.address}</span>
                                    </div>
                                )}
                                {outlet.openTime && outlet.closeTime && (
                                    <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>{outlet.openTime} - {outlet.closeTime}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <SearchBar placeholder={`Cari produk...`} />
                </div>
            </div>

            {/* Category Filter */}
            <CategoryFilter categories={categories} primaryColor={primaryColor} />

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {products.length === 0 ? (
                    <div className="text-center py-24 bg-gradient-to-br from-zinc-50 to-white rounded-[2rem] border border-dashed border-zinc-200 flex flex-col items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
                            <Package className="w-12 h-12 text-zinc-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-900 mb-3">Produk tidak ditemukan</h3>
                        <p className="text-zinc-500 max-w-sm mx-auto">Coba pilih kategori lain atau gunakan kata kunci pencarian yang berbeda.</p>
                        <Link
                            href={`/catalog/${slugify(outlet.name)}`}
                            className="mt-6 px-6 py-3 rounded-full font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Lihat Semua Produk
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-zinc-900">
                                {query ? `Hasil pencarian "${query}"` : 'Produk Tersedia'}
                            </h2>
                            <span className="text-sm text-zinc-500">{products.length} item</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 pb-20">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    id={product.id}
                                    name={product.name}
                                    price={Number(product.price)}
                                    stock={product.stock}
                                    imageUrl={product.imageUrl}
                                    category={product.categoryName || undefined}
                                    isActive={product.isActive ?? true}
                                    primaryColor={primaryColor}
                                    variants={product.variants}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
