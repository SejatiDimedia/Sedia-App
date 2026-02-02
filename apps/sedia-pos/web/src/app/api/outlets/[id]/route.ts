import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/outlets/[id] - Get single outlet
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [outlet] = await db
            .select()
            .from(posSchema.outlets)
            .where(
                and(
                    eq(posSchema.outlets.id, id),
                    eq(posSchema.outlets.ownerId, session.user.id)
                )
            );

        if (!outlet) {
            return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
        }

        return NextResponse.json(outlet);
    } catch (error) {
        console.error("Error fetching outlet:", error);
        return NextResponse.json(
            { error: "Failed to fetch outlet" },
            { status: 500 }
        );
    }
}

// PUT /api/outlets/[id] - Update outlet
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, address, phone } = body;

        const [updatedOutlet] = await db
            .update(posSchema.outlets)
            .set({
                name,
                address: address || null,
                phone: phone || null,
            })
            .where(
                and(
                    eq(posSchema.outlets.id, id),
                    eq(posSchema.outlets.ownerId, session.user.id)
                )
            )
            .returning();

        if (!updatedOutlet) {
            return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
        }

        return NextResponse.json(updatedOutlet);
    } catch (error) {
        console.error("Error updating outlet:", error);
        return NextResponse.json(
            { error: "Failed to update outlet" },
            { status: 500 }
        );
    }
}

// DELETE /api/outlets/[id] - Delete outlet
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [deletedOutlet] = await db
            .delete(posSchema.outlets)
            .where(
                and(
                    eq(posSchema.outlets.id, id),
                    eq(posSchema.outlets.ownerId, session.user.id)
                )
            )
            .returning();

        if (!deletedOutlet) {
            return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Outlet deleted successfully" });
    } catch (error) {
        console.error("Error deleting outlet:", error);
        return NextResponse.json(
            { error: "Failed to delete outlet" },
            { status: 500 }
        );
    }
}
