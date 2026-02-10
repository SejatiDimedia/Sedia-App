"use client";

interface KatsiraLogoProps {
    className?: string;
    size?: number | string;
    primaryColor?: string;
    secondaryColor?: string;
    collapsed?: boolean;
}

export default function KatsiraLogo({
    className = "",
    size = 40,
    primaryColor = "var(--primary-700)",
    secondaryColor = "var(--secondary-600)",
    collapsed = false
}: KatsiraLogoProps) {
    if (collapsed) {
        return (
            <div className={`flex items-center justify-center font-playfair font-black italic select-none ${className}`} style={{ fontSize: size }}>
                <span style={{ color: primaryColor }}>K</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center tracking-tighter font-playfair select-none ${className}`} style={{ fontSize: size }}>
            <span className="font-black italic" style={{ color: primaryColor }}>K</span>
            <span className="font-semibold -ml-[0.05em]" style={{ color: primaryColor }}>atsira</span>
        </div>
    );
}
