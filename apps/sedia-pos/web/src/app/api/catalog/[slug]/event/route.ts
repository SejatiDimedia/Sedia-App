import { NextRequest, NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify } from "@/utils/slug";

const VALID_EVENTS = ["product_view", "wa_click", "add_to_cart"];

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await props.params;
        const { visitorId, eventType, productId } = await req.json();

        if (!visitorId || !eventType) {
            return NextResponse.json({ error: "visitorId and eventType are required" }, { status: 400 });
        }

        if (!VALID_EVENTS.includes(eventType)) {
            return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
        }

        const decodedSlug = decodeURIComponent(slug);

        // Resolve outlet
        let outlet = await db.query.outlets.findFirst({
            where: eq(posSchema.outlets.id, decodedSlug)
        });

        if (!outlet) {
            const allOutlets = await db.select().from(posSchema.outlets);
            outlet = allOutlets.find(o => slugify(o.name) === decodedSlug);
        }

        if (!outlet) {
            return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
        }

        const eventDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

        await db.insert(posSchema.catalogEvents).values({
            outletId: outlet.id,
            visitorId,
            eventType,
            productId: productId || null,
            eventDate,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Catalog Events API] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
