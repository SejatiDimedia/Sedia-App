import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// DELETE /api/loyalty/tiers/[id] - Delete a member tier
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Check if tier is being used by any customers
        const customersUsingTier = await db
            .select({ id: posSchema.customers.id })
            .from(posSchema.customers)
            .where(eq(posSchema.customers.tierId, id))
            .limit(1);

        if (customersUsingTier.length > 0) {
            return NextResponse.json(
                { error: "Tier ini masih digunakan oleh member. Pindahkan member ke tier lain terlebih dahulu." },
                { status: 400 }
            );
        }

        await db.delete(posSchema.memberTiers).where(eq(posSchema.memberTiers.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting tier:", error);
        return NextResponse.json({ error: "Failed to delete tier" }, { status: 500 });
    }
}

// PATCH /api/loyalty/tiers/[id] - Update a member tier
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, minPoints, discountPercent, pointMultiplier, color, isDefault } = body;

        // Get existing tier to get outletId
        const [existing] = await db
            .select()
            .from(posSchema.memberTiers)
            .where(eq(posSchema.memberTiers.id, id));

        if (!existing) {
            return NextResponse.json({ error: "Tier not found" }, { status: 404 });
        }

        // If setting as default, unset others first
        if (isDefault && !existing.isDefault) {
            await db
                .update(posSchema.memberTiers)
                .set({ isDefault: false })
                .where(eq(posSchema.memberTiers.outletId, existing.outletId));
        }

        const [updated] = await db
            .update(posSchema.memberTiers)
            .set({
                name: name ?? existing.name,
                minPoints: minPoints ?? existing.minPoints,
                discountPercent: discountPercent ?? existing.discountPercent,
                pointMultiplier: pointMultiplier ?? existing.pointMultiplier,
                color: color ?? existing.color,
                isDefault: isDefault ?? existing.isDefault,
            })
            .where(eq(posSchema.memberTiers.id, id))
            .returning();

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating tier:", error);
        return NextResponse.json({ error: "Failed to update tier" }, { status: 500 });
    }
}
