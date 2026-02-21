"use client";

import { useEffect } from "react";

// Generate a UUID-like string without relying on crypto.randomUUID()
function generateVisitorId(): string {
    // Use crypto.getRandomValues which has wider browser support
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    // Set version (4) and variant bits
    arr[6] = (arr[6] & 0x0f) | 0x40;
    arr[8] = (arr[8] & 0x3f) | 0x80;
    const hex = Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Silent component that tracks unique daily visitors for the catalog.
 * Uses localStorage to persist a visitor ID and pings the backend.
 */
export function VisitorTracker({ slug }: { slug: string }) {
    useEffect(() => {
        if (!slug) return;

        const trackVisit = async () => {
            try {
                // 1. Get or Create Visitor ID (persists across sessions)
                let visitorId = localStorage.getItem("sedia_pos_visitor_id");
                if (!visitorId) {
                    visitorId = generateVisitorId();
                    localStorage.setItem("sedia_pos_visitor_id", visitorId);
                }

                // 2. Ping API to record visit
                const res = await fetch(`/api/catalog/${encodeURIComponent(slug)}/visit`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ visitorId }),
                    keepalive: true,
                });

                if (!res.ok) {
                    console.warn("[Visitor Tracker] API responded with:", res.status);
                }
            } catch (error) {
                console.warn("[Visitor Tracker] Background analytics error:", error);
            }
        };

        trackVisit();
    }, [slug]);

    return null; // No UI
}
