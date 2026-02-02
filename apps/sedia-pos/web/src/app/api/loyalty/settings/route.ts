import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/loyalty/settings - Get loyalty settings for outlet
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get("outletId");

        if (!outletId) {
            return NextResponse.json({ error: "outletId is required" }, { status: 400 });
        }

        const [settings] = await db
            .select()
            .from(posSchema.loyaltySettings)
            .where(eq(posSchema.loyaltySettings.outletId, outletId));

        // Return defaults if no settings exist
        if (!settings) {
            return NextResponse.json({
                outletId,
                pointsPerAmount: 1,
                amountPerPoint: 1000,
                redemptionRate: 100,
                redemptionValue: 10000,
                isEnabled: true,
            });
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error("Error fetching loyalty settings:", error);
        return NextResponse.json({
            error: "Failed to fetch settings",
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}

// POST /api/loyalty/settings - Create or update loyalty settings
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { outletId, pointsPerAmount, amountPerPoint, redemptionRate, redemptionValue, isEnabled } = body;

        if (!outletId) {
            return NextResponse.json({ error: "outletId is required" }, { status: 400 });
        }

        // Check if settings exist
        const [existing] = await db
            .select()
            .from(posSchema.loyaltySettings)
            .where(eq(posSchema.loyaltySettings.outletId, outletId));

        if (existing) {
            // Update
            const [updated] = await db
                .update(posSchema.loyaltySettings)
                .set({
                    pointsPerAmount: pointsPerAmount ?? existing.pointsPerAmount,
                    amountPerPoint: amountPerPoint ?? existing.amountPerPoint,
                    redemptionRate: redemptionRate ?? existing.redemptionRate,
                    redemptionValue: redemptionValue ?? existing.redemptionValue,
                    isEnabled: isEnabled ?? existing.isEnabled,
                })
                .where(eq(posSchema.loyaltySettings.outletId, outletId))
                .returning();

            return NextResponse.json(updated);
        } else {
            // Create
            const [created] = await db
                .insert(posSchema.loyaltySettings)
                .values({
                    outletId,
                    pointsPerAmount: pointsPerAmount ?? 1,
                    amountPerPoint: amountPerPoint ?? 1000,
                    redemptionRate: redemptionRate ?? 100,
                    redemptionValue: redemptionValue ?? 10000,
                    isEnabled: isEnabled ?? true,
                })
                .returning();

            return NextResponse.json(created, { status: 201 });
        }
    } catch (error) {
        console.error("Error saving loyalty settings:", error);
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
