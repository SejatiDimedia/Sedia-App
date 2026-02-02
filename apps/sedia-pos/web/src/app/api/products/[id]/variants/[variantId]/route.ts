import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// PUT /api/products/[id]/variants/[variantId] - Update variant
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string; variantId: string }> }
) {
    try {
        const { variantId } = await params;
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, type, priceAdjustment, stock, isActive } = body;

        const [updatedVariant] = await db
            .update(posSchema.productVariants)
            .set({
                name,
                type,
                priceAdjustment: priceAdjustment !== undefined ? String(priceAdjustment) : undefined,
                stock,
                isActive,
            })
            .where(eq(posSchema.productVariants.id, variantId))
            .returning();

        if (!updatedVariant) {
            return NextResponse.json({ error: "Variant not found" }, { status: 404 });
        }

        return NextResponse.json(updatedVariant);
    } catch (error) {
        console.error("Error updating variant:", error);
        return NextResponse.json(
            { error: "Failed to update variant" },
            { status: 500 }
        );
    }
}

// DELETE /api/products/[id]/variants/[variantId] - Delete variant
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; variantId: string }> }
) {
    try {
        const { variantId } = await params;
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [deletedVariant] = await db
            .delete(posSchema.productVariants)
            .where(eq(posSchema.productVariants.id, variantId))
            .returning();

        if (!deletedVariant) {
            return NextResponse.json({ error: "Variant not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Variant deleted successfully" });
    } catch (error) {
        console.error("Error deleting variant:", error);
        return NextResponse.json(
            { error: "Failed to delete variant" },
            { status: 500 }
        );
    }
}
