"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductDetailModal } from "@/components/catalog/ProductDetailModal";
import { CartProvider } from "@/components/catalog/CartProvider";
import { CartDrawer } from "@/components/catalog/CartDrawer";

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
    primaryColor: string;
    outletPhone?: string | null;
    outletSlug: string;
    outletName: string;
    outletId: string;
}

export function ProductGrid({ products, primaryColor, outletPhone, outletSlug, outletName, outletId }: ProductGridProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const searchParams = useSearchParams();

    // Auto-open product modal from deep link (?product=<id>)
    useEffect(() => {
        const productId = searchParams?.get("product");
        if (productId && products.length > 0) {
            const product = products.find(p => p.id === productId);
            if (product) {
                setSelectedProduct(product);
                setIsModalOpen(true);
            }
        }
    }, [searchParams, products]);

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
            />
        </CartProvider>
    );
}
