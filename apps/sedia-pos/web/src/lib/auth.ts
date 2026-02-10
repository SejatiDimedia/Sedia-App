import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, admin } from "better-auth/plugins";
import * as authSchema from "./schema/auth-schema";
import { db } from "./db";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            ...authSchema
        }
    }),
    plugins: [
        bearer(), // Enable Bearer token support
        admin({
            adminUserIds: [],
        }),
    ],
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "user",
                input: false, // Don't allow users to set their own role via sign up
            },
        },
    },
    trustedOrigins: [
        "https://katsira-pos.vercel.app",
        "https://sedia-pos.vercel.app",
        "http://localhost:8086",
        "http://127.0.0.1:8086",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://10.0.2.2:3000",
        "http://192.168.100.33:3000",
        "http://localhost:8081",
        "http://127.0.0.1:8081"
    ],
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    callbacks: {
        session: async ({ session, user }: any) => {
            try {
                const { eq, and, ilike, desc, sql } = await import("drizzle-orm");
                const { appPermission } = await import("./schema/auth-schema");
                const { employees, roles } = await import("./schema/sedia-pos");

                // 1. Get System Role (Owner/Admin)
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

                // 2. Get Employee Data (for granular permissions)
                // Search by USER ID first, then fallback to NAME
                const empQuery = db
                    .select({
                        roleId: employees.roleId,
                        permissions: roles.permissions,
                        legacyRole: employees.role,
                        empName: employees.name
                    })
                    .from(employees)
                    .leftJoin(roles, eq(employees.roleId, roles.id))
                    .where(
                        and(
                            eq(employees.isDeleted, false),
                            sql`(${employees.userId} = ${user.id} OR ${employees.name} ILIKE ${user.name})`
                        )
                    )
                    .orderBy(desc(employees.roleId)) // Prioritize those with custom roles
                    .limit(1);

                const employeeRecord = await empQuery;

                const empData = employeeRecord[0];
                let parsedPermissions: string[] = [];

                const fs = await import("fs");
                fs.appendFileSync("/tmp/auth-debug.log", `[${new Date().toISOString()}] user: ${user.id}, role_db: ${user.role}, email: ${user.email}\n`);



                if (empData?.permissions) {
                    try {
                        parsedPermissions = typeof empData.permissions === 'string'
                            ? JSON.parse(empData.permissions)
                            : empData.permissions;
                    } catch (e) {
                        console.error("[Auth Callback] Perms parse error:", e);
                    }
                }

                // If system role is 'user' but we found an employee role, use the employee role
                const finalRole = (systemRole === 'user' && empData?.legacyRole)
                    ? empData.legacyRole
                    : systemRole;

                const permsCount = parsedPermissions.length;
                const permsPeek = parsedPermissions.slice(0, 3).join(',');

                console.error(`[Auth Callback] FINAL -> Role: ${finalRole}, Perms: ${permsCount} (${permsPeek}), EmpID: ${empData?.roleId}`);

                return {
                    ...session,
                    user: {
                        ...user,
                        role: finalRole,
                        roleId: empData?.roleId || null,
                        permissions: parsedPermissions,
                        _debug_role: finalRole,
                        _debug_perms: `${permsCount}|${permsPeek}`,
                        _debug_sync: new Date().toLocaleTimeString()
                    }
                };
            } catch (e) {
                console.error("[Auth Callback] Error:", e);
                return session;
            }
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: false, // Disabled to ensure role/permissions are always fresh
            maxAge: 5 * 60, // 5 minutes
        },
    },
});

export type Session = typeof auth.$Infer.Session;
