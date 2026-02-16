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

// Font loading
// We'll use a standard serif font available in edge runtime if we can't load the custom one,
// but let's try to load a font.
// For simplicity and speed in this iteration, we'll use system fonts or reliable fallbacks.
// If needed, we can fetch fonts from Google Fonts.

export default async function Image() {
    // Katsira Brand Colors from globals.css
    const primary950 = "#091515";
    const primary500 = "#377f7e";
    const secondary500 = "#f5c23c"; // Gold accent

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
                    fontFamily: "serif",
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
                        gap: "16px",
                        marginBottom: "24px",
                    }}
                >
                    {/* Iconic "K" Logo Mark */}
                    <div
                        style={{
                            display: "flex",
                            width: "80px",
                            height: "80px",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "64px",
                            fontWeight: 900,
                            fontStyle: "italic",
                        }}
                    >
                        K
                    </div>
                    {/* Wordmark */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <span
                            style={{
                                color: "white",
                                fontSize: "64px",
                                fontWeight: 700,
                                letterSpacing: "-0.05em",
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
                        gap: "8px",
                    }}
                >
                    <div
                        style={{
                            fontSize: "32px",
                            color: "white",
                            fontWeight: 600,
                            letterSpacing: "0.05em",
                            textAlign: "center",
                            textTransform: "uppercase",
                        }}
                    >
                        Modern Point of Sales
                    </div>
                    <div
                        style={{
                            fontSize: "24px",
                            color: "#94d0cf", // primary-300
                            textAlign: "center",
                            marginTop: "12px",
                        }}
                    >
                        Kelola Mudah, Rezeki Melimpah
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
            // Simple approach: relying on default fonts first to ensure it works.
            // If the user wants specific fonts, we can add fetch() calls here.
        }
    );
}
