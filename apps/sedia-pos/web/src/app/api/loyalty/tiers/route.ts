import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/loyalty/tiers - Get member tiers for outlet
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get("outletId");

        if (!outletId) {
            return NextResponse.json({ error: "outletId is required" }, { status: 400 });
        }

        const tiers = await db
            .select()
            .from(posSchema.memberTiers)
            .where(eq(posSchema.memberTiers.outletId, outletId))
            .orderBy(asc(posSchema.memberTiers.minPoints));

        return NextResponse.json(tiers);
    } catch (error) {
        console.error("Error fetching member tiers:", error);
        return NextResponse.json({ error: "Failed to fetch tiers" }, { status: 500 });
    }
}

// POST /api/loyalty/tiers - Create new member tier
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { outletId, name, minPoints, discountPercent, pointMultiplier, color, isDefault } = body;

        if (!outletId || !name) {
            return NextResponse.json({ error: "outletId and name are required" }, { status: 400 });
        }

        // If this is set as default, remove default from others
        if (isDefault) {
            await db
                .update(posSchema.memberTiers)
                .set({ isDefault: false })
                .where(eq(posSchema.memberTiers.outletId, outletId));
        }

        const [tier] = await db
            .insert(posSchema.memberTiers)
            .values({
                outletId,
                name,
                minPoints: minPoints ?? 0,
                discountPercent: discountPercent ?? "0",
                pointMultiplier: pointMultiplier ?? "1.00",
                color: color ?? "#6b7280",
                isDefault: isDefault ?? false,
            })
            .returning();

        return NextResponse.json(tier, { status: 201 });
    } catch (error) {
        console.error("Error creating member tier:", error);
        return NextResponse.json({ error: "Failed to create tier" }, { status: 500 });
    }
}
