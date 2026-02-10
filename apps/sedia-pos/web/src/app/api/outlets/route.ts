import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

// GET /api/outlets - Fetch user's outlets
export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            console.log("[API Outlets] No session found");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get owned outlets
        // 1. Get owned outlets
        const ownedOutlets = await db.query.outlets.findMany({
            where: eq(posSchema.outlets.ownerId, session.user.id),
        });

        // 2. Get employee-assigned outlets
        const employee = await db.query.employees.findFirst({
            where: and(
                eq(posSchema.employees.userId, session.user.id),
                eq(posSchema.employees.isDeleted, false)
            ),
            with: {
                outlet: true, // Legacy single outlet
                employeeOutlets: {
                    with: {
                        outlet: true
                    }
                }
            }
        });

        const outletMap = new Map<string, any>();

        // Add owned outlets to map
        ownedOutlets.forEach(o => {
            outletMap.set(o.id, o);
        });

        if (employee) {
            // Add outlets from junction table
            employee.employeeOutlets?.forEach(eo => {
                if (eo.outlet) outletMap.set(eo.outlet.id, eo.outlet);
            });

            // Add legacy single outlet
            if (employee.outlet) {
                outletMap.set(employee.outlet.id, employee.outlet);
            }
        }

        const combinedOutlets = Array.from(outletMap.values());
        console.log("[API Outlets] Total unique outlets found:", combinedOutlets.length);
        return NextResponse.json(combinedOutlets);

        console.log("[API Outlets] No outlets found for user");
        return NextResponse.json([]);
    } catch (error) {
        console.error("Error fetching outlets:", error);
        return NextResponse.json(
            { error: "Failed to fetch outlets" },
            { status: 500 }
        );
    }
}

// POST /api/outlets - Create new outlet
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, address, phone, openTime, closeTime, greeting, isCatalogVisible } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Outlet name is required" },
                { status: 400 }
            );
        }

        const [newOutlet] = await db
            .insert(posSchema.outlets)
            .values({
                name,
                address: address || null,
                phone: phone || null,
                openTime: openTime || null,
                closeTime: closeTime || null,
                greeting: greeting || null,
                isCatalogVisible: isCatalogVisible ?? true,
                ownerId: session.user.id,
            })
            .returning();

        return NextResponse.json(newOutlet, { status: 201 });
    } catch (error) {
        console.error("Error creating outlet:", error);
        return NextResponse.json(
            { error: "Failed to create outlet" },
            { status: 500 }
        );
    }
}


