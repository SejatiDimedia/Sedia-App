"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useOutlet } from "./outlet-provider";

const BrandingContext = createContext({});

export const useBranding = () => useContext(BrandingContext);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const { activeOutlet } = useOutlet();

    const brandingStyles = useMemo(() => {
        if (!activeOutlet) return "";

        const primaryHex = activeOutlet.primaryColor || "#2e6a69";
        const secondaryHex = activeOutlet.secondaryColor || "#f2b30c";

        // Helper to convert Hex to HSL for better Tailwind compatibility
        const hexToHSL = (hex: string) => {
            let r = 0, g = 0, b = 0;
            if (hex.length === 4) {
                r = parseInt(hex[1] + hex[1], 16);
                g = parseInt(hex[2] + hex[2], 16);
                b = parseInt(hex[3] + hex[3], 16);
            } else if (hex.length === 7) {
                r = parseInt(hex.substring(1, 3), 16);
                g = parseInt(hex.substring(3, 5), 16);
                b = parseInt(hex.substring(5, 7), 16);
            }
            r /= 255; g /= 255; b /= 255;
            let max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h = 0, s, l = (max + min) / 2;
            if (max === min) h = s = 0;
            else {
                let d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
        };

        const pHSL = hexToHSL(primaryHex);
        const sHSL = hexToHSL(secondaryHex);

        return `
            :root {
                /* Target the raw variables globals.css uses */
                --primary-50: HSL(${pHSL} / 0.05) !important;
                --primary-100: HSL(${pHSL} / 0.1) !important;
                --primary-200: HSL(${pHSL} / 0.2) !important;
                --primary-300: HSL(${pHSL} / 0.4) !important;
                --primary-400: HSL(${pHSL} / 0.6) !important;
                --primary-500: HSL(${pHSL} / 0.8) !important;
                --primary-600: ${primaryHex} !important;
                --primary-700: HSL(${pHSL} / 0.9) !important;
                --primary-800: HSL(${pHSL} / 0.95) !important;
                --primary-900: HSL(${pHSL} / 1) !important;

                --secondary-50: HSL(${sHSL} / 0.05) !important;
                --secondary-100: HSL(${sHSL} / 0.1) !important;
                --secondary-200: HSL(${sHSL} / 0.2) !important;
                --secondary-300: HSL(${sHSL} / 0.4) !important;
                --secondary-400: HSL(${sHSL} / 0.6) !important;
                --secondary-500: HSL(${sHSL} / 0.8) !important;
                --secondary-600: ${secondaryHex} !important;
                --secondary-700: HSL(${sHSL} / 0.9) !important;
                --secondary-800: HSL(${sHSL} / 0.95) !important;
                --secondary-900: HSL(${sHSL} / 1) !important;

                /* Shadcn / Global Averages */
                --primary: ${primaryHex} !important;
                --secondary: ${secondaryHex} !important;
            }
        `;
    }, [activeOutlet]);

    return (
        <BrandingContext.Provider value={{}}>
            {brandingStyles && (
                <style dangerouslySetInnerHTML={{ __html: brandingStyles }} />
            )}
            {children}
        </BrandingContext.Provider>
    );
}
