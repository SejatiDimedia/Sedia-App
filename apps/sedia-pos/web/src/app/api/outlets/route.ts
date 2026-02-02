import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

        console.log("[API Outlets] User:", session.user.id, session.user.email);

        // 1. Check if user owns any outlets
        const ownedOutlets = await db
            .select()
            .from(posSchema.outlets)
            .where(eq(posSchema.outlets.ownerId, session.user.id));

        if (ownedOutlets.length > 0) {
            console.log("[API Outlets] Found owned outlets:", ownedOutlets.length);
            return NextResponse.json(ownedOutlets);
        }

        // 2. Check if user is an employee - get from junction table first
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

        if (employee) {
            // Get outlets from junction table
            const assignedOutlets = employee.employeeOutlets
                ?.map(eo => eo.outlet)
                .filter(Boolean) || [];

            if (assignedOutlets.length > 0) {
                console.log("[API Outlets] Found employee outlets (junction):", assignedOutlets.map(o => o.name).join(", "));
                return NextResponse.json(assignedOutlets);
            }

            // Fallback to legacy single outlet
            if (employee.outlet) {
                console.log("[API Outlets] Found employee outlet (legacy):", employee.outlet.name);
                return NextResponse.json([employee.outlet]);
            }
        }

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
        const { name, address, phone } = body;

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


