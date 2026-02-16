import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "Katsira - Kelola Mudah, Rezeki Melimpah";
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

export default async function Image() {
    // Katsira Brand Colors from globals.css
    const primary950 = "#091515";
    const primary500 = "#377f7e";
    const secondary500 = "#f5c23c"; // Gold accent

    // Load Fonts
    // We need Playfair Display: 900 Italic (Black Italic) for 'K' and 600 (SemiBold) for 'atsira'
    // However, loading multiple fonts can be heavy. Let's try to load just one weight if possible or 2 specific ones.
    const playfairBlackItalic = await loadGoogleFont("Playfair+Display:ital,wght@1,900", "K");
    const playfairSemiBold = await loadGoogleFont("Playfair+Display:wght@600", "atsiraModernPointofSalesKelolaMudahRezekiMelimpah");

    return new ImageResponse(
        (
            <div
                style={{
                    background: `linear-gradient(to bottom right, ${primary950}, #1a2e2e)`,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: '"Playfair Display"',
                }}
            >
                {/* Decorative background elements */}
                <div
                    style={{
                        position: "absolute",
                        top: "-200px",
                        left: "-200px",
                        width: "600px",
                        height: "600px",
                        background: primary500,
                        opacity: "0.1",
                        filter: "blur(100px)",
                        borderRadius: "50%",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: "-100px",
                        right: "-100px",
                        width: "500px",
                        height: "500px",
                        background: secondary500,
                        opacity: "0.05",
                        filter: "blur(120px)",
                        borderRadius: "50%",
                    }}
                />

                {/* Logo Container */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "10px", // Reduced margin
                    }}
                >
                    {/* Exact Replica of KatsiraLogo */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {/* K - Black Italic */}
                        <span
                            style={{
                                fontFamily: '"Playfair Display Black Italic"', // Use exact loaded font name
                                fontSize: "120px",
                                fontWeight: 900,
                                fontStyle: "italic",
                                color: "white",
                                lineHeight: 1,
                            }}
                        >
                            K
                        </span>
                        {/* atsira - SemiBold, negative margin */}
                        <span
                            style={{
                                fontFamily: '"Playfair Display"',
                                fontSize: "120px",
                                fontWeight: 600,
                                color: "white",
                                marginLeft: "-8px", // tight tracking
                                lineHeight: 1,
                            }}
                        >
                            atsira
                        </span>
                    </div>
                </div>

                {/* Tagline */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0px",
                    }}
                >
                    <div
                        style={{
                            fontSize: "24px", // Smaller detailed text
                            color: "rgba(255,255,255,0.8)",
                            fontWeight: 600,
                            letterSpacing: "0.2em",
                            textAlign: "center",
                            textTransform: "uppercase",
                            marginTop: "16px",
                            fontFamily: '"Playfair Display"', // Consistent serif
                        }}
                    >
                        Modern Point of Sales
                    </div>
                    <div
                        style={{
                            fontSize: "28px",
                            color: secondary500, // Gold
                            textAlign: "center",
                            marginTop: "16px",
                            fontWeight: 600,
                            fontStyle: "italic",
                        }}
                    >
                        Kelola Mudah, Rezeki Melimpah
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
            fonts: [
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
