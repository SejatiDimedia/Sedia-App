import { db, posSchema } from "@/lib/db";
import { eq, and, ilike } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Store, MapPin, Package, Clock } from "lucide-react";
import { getStoreStatus } from "@/utils/store-status";

import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SearchBar } from "@/components/catalog/SearchBar";
import { CategoryFilter } from "@/components/catalog/CategoryFilter";
import { slugify } from "@/utils/slug";
import { resolveR2Url, resolveR2UrlServer } from "@/lib/storage";
import { BrandTheme } from "@/components/catalog/BrandTheme";
import { GreetingPopup } from "@/components/catalog/GreetingPopup";

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
        price: Number(p.price),
        stock: p.stock,
        imageUrl: await resolveR2UrlServer(p.imageUrl),
        isActive: p.isActive ?? true,
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

    // Check if catalog is visible
    if (outlet.isCatalogVisible === false) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Store className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h1 className="text-xl font-bold text-zinc-900 mb-2">Katalog Tidak Tersedia</h1>
                    <p className="text-zinc-500 mb-6">
                        Maaf, katalog online untuk <strong>{outlet.name}</strong> saat ini sedang tidak dapat diakses atau dinonaktifkan oleh pemilik toko.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
                    >
                        Kembali ke Beranda
                    </Link>
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
    const secondaryColor = outlet.secondaryColor;
    const outletLogo = await resolveR2UrlServer(outlet.logoUrl);

    return (
        <div className="min-h-screen bg-zinc-50">
            <BrandTheme primaryColor={primaryColor} secondaryColor={secondaryColor} />

            {outlet.greeting && (
                <GreetingPopup
                    outletName={outlet.name}
                    greeting={outlet.greeting}
                    primaryColor={primaryColor}
                />
            )}

            {/* Attractive Outlet Header */}
            <div className="sticky top-14 md:top-16 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200/50 shadow-sm transition-all">
                <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <Link href="/catalog" className="shrink-0 relative group">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-700 shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden relative">
                                    {outletLogo ? (
                                        <Image
                                            src={outletLogo}
                                            alt={outlet.name}
                                            fill
                                            unoptimized
                                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                                            sizes="64px"
                                        />
                                    ) : (
                                        <Store className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" style={{ color: 'var(--brand-primary)' }} />
                                    )}
                                </div>
                                {outlet.openTime && outlet.closeTime && (
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStoreStatus(outlet.openTime, outlet.closeTime).isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                )}
                            </Link>

                            <div className="space-y-1">
                                <h1 className="text-2xl md:text-3xl font-brand font-black text-zinc-900 tracking-tight leading-none">
                                    {outlet.name}
                                </h1>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 font-medium">
                                    {outlet.address && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                                            <span className="line-clamp-1 max-w-[200px] md:max-w-md">{outlet.address}</span>
                                        </div>
                                    )}

                                    {outlet.openTime && outlet.closeTime && (
                                        <>
                                            <div className="hidden md:block w-1 h-1 rounded-full bg-zinc-300"></div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                                                <span className="tabular-nums">{outlet.openTime} - {outlet.closeTime}</span>
                                                <span className={`ml-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStoreStatus(outlet.openTime, outlet.closeTime).isOpen ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                                    {getStoreStatus(outlet.openTime, outlet.closeTime).isOpen ? "Buka" : "Tutup"}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-[420px]">
                            <SearchBar placeholder={`Cari produk di ${outlet.name}...`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <CategoryFilter categories={categories} primaryColor={primaryColor} />

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {products.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-zinc-100 shadow-sm px-6">
                        <div
                            className="w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 relative"
                            style={{
                                background: `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}15)`,
                                border: `1px solid ${primaryColor}10`
                            }}
                        >
                            <Package className="w-12 h-12 relative z-10" style={{ color: primaryColor }} />
                            <div className="absolute inset-0 bg-white rounded-[2rem] scale-75 blur-2xl opacity-50"></div>
                        </div>
                        <h3 className="text-2xl font-brand font-black text-zinc-900 mb-3 tracking-tight">Produk tidak ditemukan</h3>
                        <p className="text-zinc-500 max-w-sm mx-auto mb-10 text-lg leading-relaxed font-medium">
                            Kami tidak dapat menemukan produk <span className="text-zinc-900 italic">&quot;{query}&quot;</span>. Coba kata kunci lain atau jelajahi kategori.
                        </p>
                        <Link
                            href={`/catalog/${slugify(outlet.name)}`}
                            className="inline-flex h-14 items-center justify-center rounded-2xl px-10 text-base font-bold text-white transition-all shadow-xl hover:shadow-primary-500/20 active:scale-95"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Lihat Semua Menu
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
                        <ProductGrid
                            products={products}
                            primaryColor={primaryColor}
                            outletPhone={outlet.phone}
                            outletSlug={slugify(outlet.name)}
                            outletName={outlet.name}
                            outletId={outlet.id}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
