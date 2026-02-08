import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, or, isNull, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/roles - Fetch user's roles
export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get("outletId");

        let whereClause;
        if (outletId) {
            whereClause = or(eq(posSchema.roles.isSystem, true), eq(posSchema.roles.outletId, outletId));
        } else {
            // Fetch all roles for all outlets owned by this user
            const ownedOutlets = await db
                .select({ id: posSchema.outlets.id })
                .from(posSchema.outlets)
                .where(eq(posSchema.outlets.ownerId, session.user.id));

            const ownedOutletIds = ownedOutlets.map(o => o.id);

            if (ownedOutletIds.length > 0) {
                whereClause = or(eq(posSchema.roles.isSystem, true), inArray(posSchema.roles.outletId, ownedOutletIds));
            } else {
                whereClause = eq(posSchema.roles.isSystem, true);
            }
        }

        const roles = await db.select().from(posSchema.roles).where(whereClause);

        return NextResponse.json(roles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        return NextResponse.json(
            { error: "Failed to fetch roles" },
            { status: 500 }
        );
    }
}

// OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
