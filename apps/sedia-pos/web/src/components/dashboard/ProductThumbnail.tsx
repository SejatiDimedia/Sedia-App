"use client";

import { useState } from "react";
import { Package } from "lucide-react";

interface ProductThumbnailProps {
    src: string | null;
    alt: string;
    className?: string;
}

export function ProductThumbnail({ src, alt, className = "h-10 w-10" }: ProductThumbnailProps) {
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return (
            <div className={`${className} flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-400`}>
                <Package className="h-5 w-5" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={`${className} rounded-lg object-cover bg-zinc-100`}
            onError={() => setHasError(true)}
        />
    );
}
