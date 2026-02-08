import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, and, or, inArray } from "drizzle-orm";

// POST /api/employees/verify-pin - Verify employee PIN for mobile login
export async function POST(request: Request) {
    try {
        console.error("!!! VERIFY PIN HIT !!!"); // Force Visibility
        const body = await request.json();
        const { outletId, pinCode } = body;

        console.error("[PIN Verify] Request:", { outletId, pinCode: pinCode ? "***" : "missing" });

        if (!outletId || !pinCode) {
            return NextResponse.json(
                { error: "outletId and pinCode are required" },
                { status: 400 }
            );
        }

        // Get employee IDs assigned to this outlet via junction table
        const junctionEntries = await db
            .select({ employeeId: posSchema.employeeOutlets.employeeId })
            .from(posSchema.employeeOutlets)
            .where(eq(posSchema.employeeOutlets.outletId, outletId));

        const junctionEmployeeIds = junctionEntries.map(e => e.employeeId);

        console.log("[PIN Verify] Employees via junction:", junctionEmployeeIds.length);

        // Find employee with matching PIN - check both junction table AND legacy outletId
        let employee = null;

        // First check junction table employees
        if (junctionEmployeeIds.length > 0) {
            const [junctionMatch] = await db
                .select({
                    id: posSchema.employees.id,
                    name: posSchema.employees.name,
                    // Prefer dynamic role name, fallback to legacy role string
                    roleName: posSchema.roles.name,
                    roleId: posSchema.employees.roleId, // Added roleId
                    permissions: posSchema.roles.permissions,
                    legacyRole: posSchema.employees.role,
                    isActive: posSchema.employees.isActive,
                })
                .from(posSchema.employees)
                .leftJoin(posSchema.roles, eq(posSchema.employees.roleId, posSchema.roles.id))
                .where(
                    and(
                        inArray(posSchema.employees.id, junctionEmployeeIds),
                        eq(posSchema.employees.pinCode, pinCode),
                        eq(posSchema.employees.isActive, true)
                    )
                );
            employee = junctionMatch;
        }

        // If not found in junction, check legacy outletId
        if (!employee) {
            const [legacyMatch] = await db
                .select({
                    id: posSchema.employees.id,
                    name: posSchema.employees.name,
                    roleName: posSchema.roles.name,
                    roleId: posSchema.employees.roleId, // Added roleId
                    permissions: posSchema.roles.permissions,
                    legacyRole: posSchema.employees.role,
                    isActive: posSchema.employees.isActive,
                })
                .from(posSchema.employees)
                .leftJoin(posSchema.roles, eq(posSchema.employees.roleId, posSchema.roles.id))
                .where(
                    and(
                        eq(posSchema.employees.outletId, outletId),
                        eq(posSchema.employees.pinCode, pinCode),
                        eq(posSchema.employees.isActive, true)
                    )
                );
            employee = legacyMatch;
        }

        if (!employee) {
            console.log("[PIN Verify] No match found for PIN");
            return NextResponse.json(
                { error: "PIN tidak valid atau karyawan tidak aktif" },
                { status: 401 }
            );
        }

        console.log("[PIN Verify] RAW DB RESULT:", JSON.stringify(employee, null, 2));

        let parsedPermissions: string[] = [];
        try {
            if (typeof employee.permissions === 'string') {
                parsedPermissions = JSON.parse(employee.permissions);
            } else if (Array.isArray(employee.permissions)) {
                parsedPermissions = employee.permissions;
            }
        } catch (e) {
            console.error("[PIN Verify] Failed to parse permissions:", e);
        }

        console.log("[PIN Verify] Success:", { name: employee.name, roleId: employee.roleId, permsCount: parsedPermissions.length });

        const finalResponse = {
            success: true,
            employee: {
                id: employee.id,
                name: employee.name,
                roleId: employee.roleId, // Included in Response
                // Use dynamic role name if available, otherwise legacy
                role: employee.roleName || employee.legacyRole,
                permissions: parsedPermissions,
                _debug_hit_at: new Date().toLocaleTimeString(), // VISUAL PROOF
                _server_tag: "LOCAL_V4"
            },
        };

        console.error("!!! VERIFY PIN - FINAL RESPONSE !!!", JSON.stringify(finalResponse, null, 2));

        return NextResponse.json(finalResponse);
    } catch (error) {
        console.error("Error verifying PIN:", error);
        return NextResponse.json(
            { error: "Failed to verify PIN" },
            { status: 500 }
        );
    }
}
