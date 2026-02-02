import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logActivity } from "@/lib/logging";

// GET /api/tax-settings - Fetch tax settings for an outlet
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get("outletId");

        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!outletId) {
            return NextResponse.json({ error: "Outlet ID is required" }, { status: 400 });
        }

        const taxSettings = await db.query.taxSettings.findFirst({
            where: eq(posSchema.taxSettings.outletId, outletId),
        });

        return NextResponse.json(taxSettings || null);
    } catch (error) {
        console.error("Error fetching tax settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch tax settings" },
            { status: 500 }
        );
    }
}

// POST /api/tax-settings - Create or update tax settings
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { outletId, name, rate, type, isEnabled, isInclusive } = body;

        if (!outletId) {
            return NextResponse.json({ error: "Outlet ID is required" }, { status: 400 });
        }

        // Check if settings already exist
        const existingSettings = await db.query.taxSettings.findFirst({
            where: eq(posSchema.taxSettings.outletId, outletId),
        });

        let result;
        if (existingSettings) {
            [result] = await db
                .update(posSchema.taxSettings)
                .set({
                    name,
                    rate,
                    type,
                    isEnabled,
                    isInclusive,
                    updatedAt: new Date(),
                })
                .where(eq(posSchema.taxSettings.outletId, outletId))
                .returning();

            await logActivity({
                outletId,
                action: 'UPDATE',
                entityType: 'OUTLET',
                entityId: outletId,
                description: `Mengubah pengaturan pajak: ${name} (${rate}%)`,
                metadata: { before: existingSettings, after: result }
            });
        } else {
            [result] = await db
                .insert(posSchema.taxSettings)
                .values({
                    outletId,
                    name,
                    rate,
                    type,
                    isEnabled,
                    isInclusive,
                })
                .returning();

            await logActivity({
                outletId,
                action: 'UPDATE',
                entityType: 'OUTLET',
                entityId: outletId,
                description: `Mengaktifkan pengaturan pajak: ${name} (${rate}%)`,
                metadata: { after: result }
            });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error saving tax settings:", error);
        return NextResponse.json(
            { error: "Failed to save tax settings" },
            { status: 500 }
        );
    }
}
