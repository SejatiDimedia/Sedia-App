"use client";

import { useState } from "react";
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
}

export function ProductGrid({ products, primaryColor, outletPhone, outletSlug, outletName }: ProductGridProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
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
            />

            <CartDrawer
                primaryColor={primaryColor}
                outletPhone={outletPhone}
                outletName={outletName}
            />
        </CartProvider>
    );
}
