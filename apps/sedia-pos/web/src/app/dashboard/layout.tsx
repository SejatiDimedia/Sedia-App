import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { LogOut } from "lucide-react";
import DashboardSidebar from "./sidebar";
import PermissionGuard from "./_components/permission-guard";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import LogoutButton from "@/components/logout-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // Verify role directly from DB because session role might be unreliable
    let effectiveRole = "cashier"; // Default safe role
    let isAdmin = false;
    let permission: any = null;
    let debugPermission = null;

    if (session?.user?.id) {
        try {
            // 1. Check App Permission (Admin check)
            permission = await db.query.appPermission.findFirst({
                where: (table, { eq, and }) => and(
                    eq(table.userId, session.user.id),
                    eq(table.appId, "sedia-pos")
                )
            });

            debugPermission = permission;
            isAdmin = permission?.role === "admin" || permission?.role === "owner";

            if (isAdmin) {
                effectiveRole = permission?.role; // 'admin' or 'owner'
            } else {
                // 2. If not admin, check Employee role
                const employee = await db.query.employees.findFirst({
                    where: (table, { eq }) => eq(table.userId, session.user.id),
                    with: { role: true }
                });

                if (employee) {
                    // Check if employee is inactive
                    if (!employee.isActive) {
                        permission = null; // Deny access
                    } else {
                        // Handle collision between 'role' column (string) and 'role' relation (object)
                        // If relation is present, employee.role is likely the object.
                        // We need to cast or check type carefully.
                        const roleData = employee.role as any;

                        if (roleData && typeof roleData === 'object' && roleData.name) {
                            effectiveRole = roleData.name;
                            if (roleData.permissions) {
                                try {
                                    permission = JSON.parse(roleData.permissions);
                                } catch { }
                            }
                        } else {
                            // Fallback to legacy string if relation is null (Drizzle might return null for relation)
                            // But if Drizzle shadows it, we might get null even if column has string.
                            // However, usually we can access column via other ways or assume legacy users need migration.
                            // For safety, default to "cashier" if nothing found.
                            effectiveRole = typeof employee.role === 'string' ? employee.role : "cashier";
                        }
                    }
                } else {
                    // If not admin and no employee record found (deleted?), deny access
                    permission = null;
                }
            }
        } catch (e) {
            console.error("Layout DB Error:", e);
        }
    }

    // Server-side role check - allow admin OR user (employees)
    // If no permission found for this app, then deny.
    if (!permission) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-4">
                <div className="rounded-2xl bg-red-100 p-4">
                    <LogOut className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900">Akses Ditolak</h1>
                <p className="max-w-md text-center text-zinc-500">
                    Akun Anda ({session?.user?.email}) tidak memiliki izin administrator untuk mengakses dashboard ini.
                </p>
                <div className="rounded bg-zinc-100 p-2 text-xs font-mono text-zinc-500 overflow-auto max-w-lg mb-4">
                    DB Permission: {JSON.stringify(debugPermission || "None")}
                </div>

                <LogoutButton className="rounded-lg bg-white px-4 py-2 font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50">
                    Keluar & Gunakan Akun Lain
                </LogoutButton>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-zinc-100">
            <DashboardSidebar user={session.user} role={effectiveRole} permissions={Array.isArray(permission) ? permission : undefined}>
                <PermissionGuard role={effectiveRole} permissions={Array.isArray(permission) ? permission : undefined}>
                    {children}
                </PermissionGuard>
            </DashboardSidebar>
        </div>
    );
}
