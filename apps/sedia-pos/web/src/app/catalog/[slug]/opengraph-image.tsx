import { ImageResponse } from "next/og";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify } from "@/utils/slug";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "Katsira Catalog";
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = "image/png";

// Font Loader
async function loadGoogleFont(font: string, text: string) {
    const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);

    if (resource) {
        const response = await fetch(resource[1]);
        if (response.status == 200) {
            return await response.arrayBuffer();
        }
    }

    throw new Error("failed to load font data");
}

export default async function Image({ params }: { params: { slug: string } }) {
    const slug = params.slug;
    const decodedSlug = decodeURIComponent(slug);

    // Font Loading
    // We want "Inter" for the Shop Name (Clean, Modern) and "Playfair Display" for the Footer Brand.
    const interBold = await loadGoogleFont("Inter:wght@800", decodedSlug + "Lihat Katalog Pesan Online");
    const playfairBlackItalic = await loadGoogleFont("Playfair+Display:ital,wght@1,900", "K");
    const playfairSemiBold = await loadGoogleFont("Playfair+Display:wght@600", "atsira Powered by");

    // Fetch Outlet Data
    let outlet = null;
    let outletName = "Katsira Store";
    let primaryColor = "#091515"; // Default Deep Teal
    let secondaryColor = "#f5c23c"; // Default Gold

    try {
        // 1. Try to find by UUID first
        let outlets = await db
            .select()
            .from(posSchema.outlets)
            .where(eq(posSchema.outlets.id, decodedSlug))
            .limit(1);

        if (outlets.length === 0) {
            // 2. Fallback: Find by slugified name (need to fetch all and filter in JS for slugify match if DB doesn't support transformed query easily)
            // Optimization: Fetch all outlets is bad for scale, but okay for MVP/small scale. 
            // Better: we assume the slug IS the name if not UUID, or we just rely on the fact that we can't easily slugify in SQL without extensions.
            // For now, let's fetch all outlets (limit to reasonable number) and filter.
            const allOutlets = await db.select().from(posSchema.outlets);
            const match = allOutlets.find(o => slugify(o.name) === decodedSlug);
            if (match) {
                outlet = match;
            }
        } else {
            outlet = outlets[0];
        }

        if (outlet) {
            outletName = outlet.name;
            if (outlet.primaryColor) primaryColor = outlet.primaryColor;
            if (outlet.secondaryColor) secondaryColor = outlet.secondaryColor;
        }

    } catch (e) {
        console.error("OG Image generation failed to fetch outlet:", e);
    }

    return new ImageResponse(
        (
            <div
                style={{
                    background: primaryColor,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: '"Inter"', // Main font for content
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Decorative Elements */}
                <div
                    style={{
                        position: "absolute",
                        top: "-20%",
                        left: "-10%",
                        width: "600px",
                        height: "600px",
                        background: secondaryColor,
                        opacity: "0.15",
                        filter: "blur(120px)",
                        borderRadius: "50%",
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        bottom: "-20%",
                        right: "-10%",
                        width: "500px",
                        height: "500px",
                        background: "white",
                        opacity: "0.05",
                        filter: "blur(100px)",
                        borderRadius: "50%",
                    }}
                />

                {/* Content */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        zIndex: 10,
                        padding: "60px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "32px",
                        background: "rgba(0,0,0,0.2)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                        maxWidth: "90%",
                    }}
                >
                    <h1
                        style={{
                            fontSize: "72px",
                            fontWeight: 800,
                            margin: "0 0 24px 0",
                            letterSpacing: "-0.03em",
                            lineHeight: 1.1,
                            textShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        }}
                    >
                        {outletName}
                    </h1>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            background: "white",
                            color: primaryColor,
                            padding: "12px 24px",
                            borderRadius: "100px",
                            fontWeight: 700,
                            fontSize: "24px",
                        }}
                    >
                        <span>Lihat Katalog & Pesan Online</span>
                    </div>
                </div>

                {/* Footer Branding - Consistent with App Logo */}
                <div
                    style={{
                        position: "absolute",
                        bottom: "40px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        opacity: 0.9,
                    }}
                >
                    <span style={{ fontSize: "16px", fontWeight: 500, fontFamily: '"Inter"', marginRight: "8px", opacity: 0.7 }}>Powered by</span>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {/* K - Black Italic */}
                        <span
                            style={{
                                fontFamily: '"Playfair Display Black Italic"',
                                fontSize: "32px",
                                fontWeight: 900,
                                fontStyle: "italic",
                                color: "white",
                                lineHeight: 1,
                            }}
                        >
                            K
                        </span>
                        {/* atsira - SemiBold */}
                        <span
                            style={{
                                fontFamily: '"Playfair Display"',
                                fontSize: "32px",
                                fontWeight: 600,
                                color: "white",
                                marginLeft: "-2px",
                                lineHeight: 1,
                            }}
                        >
                            atsira
                        </span>
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
            fonts: [
                {
                    name: 'Inter',
                    data: interBold,
                    weight: 800,
                },
                {
                    name: 'Playfair Display Black Italic',
                    data: playfairBlackItalic,
                    style: 'italic',
                    weight: 900,
                },
                {
                    name: 'Playfair Display',
                    data: playfairSemiBold,
                    weight: 600,
                },
            ],
        }
    );
}

