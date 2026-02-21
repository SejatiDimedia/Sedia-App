"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductDetailModal } from "@/components/catalog/ProductDetailModal";
import { CartProvider } from "@/components/catalog/CartProvider";
import { CartDrawer } from "@/components/catalog/CartDrawer";

import { Star, Package } from "lucide-react";

interface Variant {
    id: string;
    name: string;
    priceAdjustment: string | null;
    stock: number | null;
    isActive: boolean | null;
}

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string | null;
    categoryName?: string | null;
    isActive?: boolean;
    isDeleted?: boolean;
    variants?: Variant[];
}

interface ProductGridProps {
    products: Product[];
    featuredProducts?: Product[];
    searchQuery?: string;
    primaryColor: string;
    outletPhone?: string | null;
    outletSlug: string;
    outletName: string;
    outletId: string;
}

export function ProductGrid({
    products,
    featuredProducts = [],
    searchQuery = "",
    primaryColor,
    outletPhone,
    outletSlug,
    outletName,
    outletId
}: ProductGridProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const searchParams = useSearchParams();

    // Auto-open product modal from deep link (?product=<id>)
    useEffect(() => {
        const productId = searchParams?.get("product");
        if (productId) {
            const allProds = [...featuredProducts, ...products];
            const product = allProds.find(p => p.id === productId);
            if (product) {
                setSelectedProduct(product);
                setIsModalOpen(true);
            }
        }
    }, [searchParams, products, featuredProducts]);

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Clean up deep link param from URL without reload
        if (searchParams?.get("product")) {
            const url = new URL(window.location.href);
            url.searchParams.delete("product");
            window.history.replaceState({}, "", url.toString());
        }
    };

    return (
        <CartProvider outletSlug={outletSlug}>
            {/* Produk Terlaris Section */}
            {featuredProducts.length > 0 && !searchQuery && (
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-5">
                        <div
                            className="flex items-center justify-center w-8 h-8 rounded-xl"
                            style={{ backgroundColor: `${primaryColor}15` }}
                        >
                            <Star className="w-4 h-4" style={{ color: primaryColor, fill: primaryColor }} />
                        </div>
                        <h2 className="text-lg font-bold text-zinc-900">Produk Terlaris</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
                        {featuredProducts.map((product) => (
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
                                onClick={() => handleProductClick(product)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Main Products Section */}
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
                        {searchQuery
                            ? <>Kami tidak dapat menemukan produk <span className="text-zinc-900 italic">"{searchQuery}"</span>. Coba kata kunci lain atau jelajahi kategori.</>
                            : "Maaf, saat ini belum ada produk yang tersedia di kategori ini."
                        }
                    </p>
                    <Link
                        href={`/catalog/${outletSlug}`}
                        className="inline-flex h-14 items-center justify-center rounded-2xl px-10 text-base font-bold text-white transition-all shadow-xl hover:shadow-primary-500/20 active:scale-95"
                        style={{ backgroundColor: primaryColor }}
                    >
                        Lihat Semua Menu
                    </Link>
                </div>
            ) : (
                <>
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-zinc-900">
                            {searchQuery ? `Hasil pencarian "${searchQuery}"` : 'Produk Tersedia'}
                        </h2>
                        <span className="text-sm text-zinc-500">{products.length} item</span>
                    </div>

                    {/* Main Product Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5 pb-20">
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
                                onClick={() => handleProductClick(product)}
                            />
                        ))}
                    </div>
                </>
            )}

            <ProductDetailModal
                product={selectedProduct}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                primaryColor={primaryColor}
                outletPhone={outletPhone}
                outletSlug={outletSlug}
            />

            <CartDrawer
                primaryColor={primaryColor}
                outletPhone={outletPhone}
                outletName={outletName}
                outletId={outletId}
                outletSlug={outletSlug}
            />
        </CartProvider>
    );
}
