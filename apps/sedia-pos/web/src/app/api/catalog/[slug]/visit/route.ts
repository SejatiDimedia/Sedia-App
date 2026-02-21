import { NextRequest, NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify } from "@/utils/slug";

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await props.params;
        const { visitorId } = await req.json();

        if (!visitorId) {
            return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
        }

        const decodedSlug = decodeURIComponent(slug);

        // 1. Resolve Outlet (Logic matches catalog page for consistency)
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

        // 2. Record Visit (Daily Unique)
        const visitDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        try {
            await db.insert(posSchema.visitorLogs).values({
                outletId: outlet.id,
                visitorId,
                visitDate,
            }).onConflictDoNothing();
        } catch (dbError) {
            // Log and ignore specific DB errors to avoid failing the whole request UX
            console.error("[Visitor API] DB Insert error:", dbError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Visitor API] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
