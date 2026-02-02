import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logActivity } from "@/lib/logging";

// GET /api/employees - Fetch employees for an outlet
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

        if (!outletId) {
            return NextResponse.json(
                { error: "outletId is required" },
                { status: 400 }
            );
        }

        // Verify user is owner OR employee of this outlet
        const [outlet] = await db
            .select()
            .from(posSchema.outlets)
            .where(
                and(
                    eq(posSchema.outlets.id, outletId),
                    eq(posSchema.outlets.ownerId, session.user.id)
                )
            );

        if (!outlet) {
            // Check if user is an employee of this outlet
            const [employee] = await db
                .select()
                .from(posSchema.employees)
                .where(
                    and(
                        eq(posSchema.employees.outletId, outletId),
                        eq(posSchema.employees.userId, session.user.id),
                        eq(posSchema.employees.isActive, true)
                    )
                );

            if (!employee) {
                // Also check employeeOutlets junction table
                const [junction] = await db
                    .select()
                    .from(posSchema.employeeOutlets)
                    .innerJoin(posSchema.employees, eq(posSchema.employees.id, posSchema.employeeOutlets.employeeId))
                    .where(
                        and(
                            eq(posSchema.employeeOutlets.outletId, outletId),
                            eq(posSchema.employees.userId, session.user.id),
                            eq(posSchema.employees.isActive, true)
                        )
                    );

                if (!junction) {
                    return NextResponse.json({ error: "Access denied" }, { status: 403 });
                }
            }
        }

        const employees = await db
            .select({
                id: posSchema.employees.id,
                name: posSchema.employees.name,
                role: posSchema.employees.role,
                isActive: posSchema.employees.isActive,
                createdAt: posSchema.employees.createdAt,
            })
            .from(posSchema.employees)
            .where(eq(posSchema.employees.outletId, outletId));

        return NextResponse.json(employees);
    } catch (error) {
        console.error("Error fetching employees:", error);
        return NextResponse.json(
            { error: "Failed to fetch employees" },
            { status: 500 }
        );
    }
}

// POST /api/employees - Create new employee
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { outletId, name, role, pinCode } = body;

        if (!outletId || !name) {
            return NextResponse.json(
                { error: "outletId and name are required" },
                { status: 400 }
            );
        }

        // Verify user owns this outlet
        const [outlet] = await db
            .select()
            .from(posSchema.outlets)
            .where(
                and(
                    eq(posSchema.outlets.id, outletId),
                    eq(posSchema.outlets.ownerId, session.user.id)
                )
            );

        if (!outlet) {
            return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
        }

        const [newEmployee] = await db
            .insert(posSchema.employees)
            .values({
                outletId,
                name,
                role: role || "cashier",
                pinCode: pinCode || null,
                isActive: true,
            })
            .returning();

        // Log activity
        await logActivity({
            outletId,
            action: 'CREATE',
            entityType: 'EMPLOYEE',
            entityId: newEmployee.id,
            description: `Menambahkan staf baru: ${newEmployee.name}`,
            metadata: { employee: newEmployee }
        });

        return NextResponse.json(
            { id: newEmployee.id, name: newEmployee.name, role: newEmployee.role },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating employee:", error);
        return NextResponse.json(
            { error: "Failed to create employee" },
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
