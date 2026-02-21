import { NextRequest, NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, or } from "drizzle-orm";
import { slugify } from "@/utils/slug";

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await props.params;
        const body = await req.json().catch(() => ({}));
        const { visitorId } = body;

        if (!visitorId) {
            return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
        }

        const decodedSlug = decodeURIComponent(slug);

        // 1. Resolve Outlet using Core Drizzle API (more robust)
        const outletResults = await db
            .select()
            .from(posSchema.outlets)
            .where(eq(posSchema.outlets.id, decodedSlug))
            .limit(1);

        let outletData = outletResults[0];

        if (!outletData) {
            // Fallback: search by slugified name
            const allOutlets = await db.select().from(posSchema.outlets);
            outletData = allOutlets.find(o => slugify(o.name) === decodedSlug) as any;
        }

        if (!outletData) {
            return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
        }

        const outlet = outletData;


        // 2. Extract geolocation from Vercel headers
        const city = req.headers.get("x-vercel-ip-city");
        const region = req.headers.get("x-vercel-ip-country-region");
        const country = req.headers.get("x-vercel-ip-country");

        // 3. Record Visit (Daily Unique) - Use Jakarta Time
        const visitDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

        try {
            await db.insert(posSchema.visitorLogs).values({
                outletId: outlet.id,
                visitorId,
                visitDate,
                city: city ? decodeURIComponent(city) : null,
                region: region ? decodeURIComponent(region) : null,
                country,
            }).onConflictDoNothing();
        } catch (dbError) {
            console.error("[Visitor API] DB Insert error:", dbError);
            // Don't fail the whole request if insert fails (might be duplicate we missed)
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[Visitor API] CRITICAL Error:", error);
        return NextResponse.json({ error: "Internal server error", message: error?.message }, { status: 500 });
    }
}
