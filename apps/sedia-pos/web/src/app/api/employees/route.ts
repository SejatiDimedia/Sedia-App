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

        // Get employees assigned to this outlet via junction table
        const outletEmployees = await db.query.employeeOutlets.findMany({
            where: eq(posSchema.employeeOutlets.outletId, outletId),
            with: {
                employee: {
                    with: {
                        roleData: true
                    }
                }
            }
        });

        // Also get legacy employees with direct outletId (backward compat)
        const legacyEmployees = await db.query.employees.findMany({
            where: eq(posSchema.employees.outletId, outletId),
            with: {
                roleData: true
            }
        });

        // Combine and deduplicate
        const employeeMap = new Map();

        // First add legacy employees (direct outletId)
        legacyEmployees.forEach(emp => {
            if (emp.isDeleted !== true) {
                employeeMap.set(emp.id, {
                    id: emp.id,
                    name: emp.name,
                    role: emp.roleData?.name || emp.role,
                    roleId: emp.roleId,
                    isActive: emp.isActive,
                    createdAt: emp.createdAt,
                    primaryOutletId: emp.outletId,
                    outletIds: [emp.outletId],
                });
            }
        });

        // Then add/override from junction table
        outletEmployees.forEach(eo => {
            if (eo.employee && eo.employee.isDeleted !== true) {
                const existing = employeeMap.get(eo.employee.id) || {
                    id: eo.employee.id,
                    name: eo.employee.name,
                    role: eo.employee.roleData?.name || eo.employee.role,
                    roleId: eo.employee.roleId,
                    isActive: eo.employee.isActive,
                    createdAt: eo.employee.createdAt,
                    outletIds: [],
                    primaryOutletId: null,
                };

                if (!existing.outletIds.includes(eo.outletId)) {
                    existing.outletIds.push(eo.outletId);
                }
                if (eo.isPrimary) {
                    existing.primaryOutletId = eo.outletId;
                }

                employeeMap.set(eo.employee.id, existing);
            }
        });

        // Final pass: ensure primaryOutletId is set if missing
        const finalEmployees = Array.from(employeeMap.values()).map(emp => {
            if (!emp.primaryOutletId && emp.outletIds.length > 0) {
                emp.primaryOutletId = emp.outletIds[0];
            }
            return emp;
        });

        return NextResponse.json(finalEmployees);
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
        const { outletId, outletIds, primaryOutletId, name, role, roleId, pinCode, email, password } = body;

        // Support both old outletId and new outletIds array
        const finalOutletIds = outletIds || (outletId ? [outletId] : []);
        const finalPrimaryOutletId = primaryOutletId || finalOutletIds[0];

        if (finalOutletIds.length === 0 || !name) {
            return NextResponse.json(
                { error: "Outlet and name are required" },
                { status: 400 }
            );
        }

        // Verify user has permission for all selected outlets (Owner or Manager/Admin)
        for (const id of finalOutletIds) {
            // 1. Check if user is owner
            const [ownedOutlet] = await db
                .select()
                .from(posSchema.outlets)
                .where(
                    and(
                        eq(posSchema.outlets.id, id),
                        eq(posSchema.outlets.ownerId, session.user.id)
                    )
                );

            if (ownedOutlet) continue;

            // 2. Check if user is a manager or admin of this outlet (Primary)
            const employeeData = await db.query.employees.findFirst({
                where: and(
                    eq(posSchema.employees.userId, session.user.id),
                    eq(posSchema.employees.isActive, true),
                    eq(posSchema.employees.isDeleted, false)
                ),
                with: {
                    roleData: true,
                    employeeOutlets: {
                        where: eq(posSchema.employeeOutlets.outletId, id)
                    }
                }
            });

            if (employeeData) {
                const userRole = (employeeData.roleData?.name || employeeData.role || "").toLowerCase();
                const hasGlobalPermission = ["manager", "admin"].includes(userRole);

                // If the employee is assigned to this outlet (either primary or junction)
                const isAssignedToThisOutlet = employeeData.outletId === id || employeeData.employeeOutlets.length > 0;

                if (hasGlobalPermission && isAssignedToThisOutlet) continue;
            }

            return NextResponse.json({ error: `Akses ditolak atau outlet tidak ditemukan: ${id}` }, { status: 403 });
        }

        let userId: string | null = null;
        let finalName = name;

        // Create User Account if email/password provided (Logic from actions/employees.ts)
        if (email && password) {
            try {
                const newUser = await auth.api.signUpEmail({
                    body: {
                        email: email,
                        password: password,
                        name: name,
                    },
                    asResponse: false
                });

                if (newUser?.user?.id) {
                    userId = newUser.user.id;
                    finalName = newUser.user.name;

                    const { appPermission } = await import("@/lib/schema/auth-schema");
                    await db.insert(appPermission).values({
                        userId: userId,
                        appId: "sedia-pos",
                        role: "user",
                        uploadEnabled: true,
                        storageLimit: 524288000,
                    });
                }
            } catch (err: any) {
                console.error("Auth creation failed:", err);
                if (err?.body?.message) {
                    return NextResponse.json({ error: err.body.message }, { status: 400 });
                }
                return NextResponse.json({ error: "Gagal membuat akun login. Email mungkin sudah digunakan." }, { status: 400 });
            }
        }

        const [newEmployee] = await db
            .insert(posSchema.employees)
            .values({
                outletId: finalPrimaryOutletId, // Legacy field
                userId,
                name: finalName,
                role: role || "cashier",
                roleId: roleId || null,
                pinCode: pinCode || null,
                isActive: true,
                isDeleted: false,
            })
            .returning();

        // Create junction table entries for all selected outlets
        for (const id of finalOutletIds) {
            await db.insert(posSchema.employeeOutlets).values({
                employeeId: newEmployee.id,
                outletId: id,
                isPrimary: id === finalPrimaryOutletId,
            });
        }

        // Log activity
        await logActivity({
            outletId: finalPrimaryOutletId,
            action: 'CREATE',
            entityType: 'EMPLOYEE',
            entityId: newEmployee.id,
            description: `Menambahkan staf baru: ${newEmployee.name}`,
            metadata: { employee: newEmployee, outletIds: finalOutletIds }
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
