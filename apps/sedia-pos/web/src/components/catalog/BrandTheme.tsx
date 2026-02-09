"use client";

import { useEffect } from "react";


export function BrandTheme({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor?: string | null }) {
    useEffect(() => {
        if (!primaryColor) return;

        const root = document.documentElement;

        // We set the primary color variable directly
        root.style.setProperty("--brand-primary", primaryColor);

        if (secondaryColor) {
            root.style.setProperty("--brand-secondary", secondaryColor);
        }

    }, [primaryColor, secondaryColor]);

    return (
        <style jsx global>{`
            :root {
                --brand-primary: ${primaryColor};
                --brand-secondary: ${secondaryColor || '#F59E0B'};
            }
        `}</style>
    );
}
