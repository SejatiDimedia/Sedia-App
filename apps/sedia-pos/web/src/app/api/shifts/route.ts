import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/shifts - Get active shift or shift history
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
        const status = searchParams.get("status"); // 'open', 'closed'
        const employeeId = searchParams.get("employeeId");

        const conditions = [];
        if (outletId) conditions.push(eq(posSchema.shifts.outletId, outletId));
        if (status) conditions.push(eq(posSchema.shifts.status, status));
        if (employeeId) conditions.push(eq(posSchema.shifts.employeeId, employeeId));

        const shifts = await db
            .select({
                shift: posSchema.shifts,
                employee: {
                    name: posSchema.employees.name,
                },
            })
            .from(posSchema.shifts)
            .leftJoin(
                posSchema.employees,
                eq(posSchema.shifts.employeeId, posSchema.employees.id)
            )
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(posSchema.shifts.startTime));

        return NextResponse.json(shifts);
    } catch (error) {
        console.error("Error fetching shifts:", error);
        return NextResponse.json(
            { error: "Failed to fetch shifts" },
            { status: 500 }
        );
    }
}

// POST /api/shifts - Open new shift
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { outletId, employeeId, startingCash } = body;

        // Check if employee already has open shift
        const [existingShift] = await db
            .select()
            .from(posSchema.shifts)
            .where(
                and(
                    eq(posSchema.shifts.employeeId, employeeId),
                    eq(posSchema.shifts.status, "open")
                )
            );

        if (existingShift) {
            return NextResponse.json(
                { error: "Employee already has an open shift" },
                { status: 400 }
            );
        }

        const [newShift] = await db
            .insert(posSchema.shifts)
            .values({
                outletId,
                employeeId,
                startingCash: String(startingCash || 0),
                status: "open",
            })
            .returning();

        return NextResponse.json(newShift, { status: 201 });
    } catch (error) {
        console.error("Error opening shift:", error);
        return NextResponse.json(
            { error: "Failed to open shift" },
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
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
