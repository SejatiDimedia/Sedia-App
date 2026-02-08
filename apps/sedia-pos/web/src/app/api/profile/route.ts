import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, sql, desc } from "drizzle-orm";
import { employees, roles } from "@/lib/schema/sedia-pos";
import { appPermission } from "@/lib/schema/auth-schema";

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user;

        // 1. Get System Role
        const systemPerms = await db
            .select()
            .from(appPermission)
            .where(
                and(
                    eq(appPermission.userId, user.id),
                    eq(appPermission.appId, "sedia-pos")
                )
            );
        const systemRole = systemPerms[0]?.role || "user";

        // 2. Get Employee Data (Try ID match, then Name match)
        const empQuery = db
            .select({
                roleId: employees.roleId,
                permissions: roles.permissions,
                legacyRole: employees.role,
                empName: employees.name,
                pinCode: employees.pinCode
            })
            .from(employees)
            .leftJoin(roles, eq(employees.roleId, roles.id))
            .where(
                and(
                    eq(employees.isDeleted, false),
                    sql`(${employees.userId} = ${user.id} OR ${employees.name} ILIKE ${user.name})`
                )
            )
            .orderBy(desc(employees.roleId))
            .limit(1);

        const employeeRecord = await empQuery;
        const empData = employeeRecord[0];

        // 3. Parse Permissions
        let finalPermissions: string[] = [];
        if (empData?.permissions) {
            try {
                finalPermissions = JSON.parse(empData.permissions);
            } catch (e) {
                console.error("Perms parse error:", e);
            }
        }

        // 4. Determine Final Role
        const finalRole = (systemRole === 'user' && empData?.legacyRole)
            ? empData.legacyRole
            : systemRole;

        return NextResponse.json({
            user: {
                ...user,
                role: finalRole,
                roleId: empData?.roleId || null,
                permissions: finalPermissions,
                _debug_source: 'api/profile',
                _debug_sync: new Date().toLocaleTimeString()
            }
        });

    } catch (e: any) {
        console.error("Profile Fetch Error:", e);
        return NextResponse.json({ error: e.toString() }, { status: 500 });
    }
}
