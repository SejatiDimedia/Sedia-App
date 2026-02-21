/**
 * Lightweight catalog event tracker.
 * Fires a background POST to record user interactions.
 */
export function trackCatalogEvent(slug: string, eventType: string, productId?: string) {
    try {
        const visitorId = localStorage.getItem("sedia_pos_visitor_id");
        if (!visitorId) return;

        fetch(`/api/catalog/${encodeURIComponent(slug)}/event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitorId, eventType, productId }),
            keepalive: true,
        }).catch(() => { }); // fire-and-forget, never block UI
    } catch {
        // silently fail
    }
}
