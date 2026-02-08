import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { LogOut } from "lucide-react";
import DashboardSidebar from "./sidebar";
import PermissionGuard from "./_components/permission-guard";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import LogoutButton from "@/components/logout-button";

import { getOutlets } from "@/actions/outlets"; // Import getOutlets
import { cookies } from "next/headers";
import { OutletProvider } from "@/providers/outlet-provider";
import { BrandingProvider } from "@/providers/branding-provider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // Verify role directly from DB because session role might be unreliable
    let effectiveRole = "cashier";
    let permissionsArray: string[] | undefined = undefined;
    let isAuthorized = false;
    let debugData: any = {};

    if (session?.user?.id) {
        try {
            // 1. Check App Permission (System Role: Owner/Admin/User)
            const appPerm = await db.query.appPermission.findFirst({
                where: (table, { eq, and }) => and(
                    eq(table.userId, session.user.id),
                    eq(table.appId, "sedia-pos")
                )
            });

            debugData.appPerm = appPerm;

            if (appPerm) {
                isAuthorized = true;
                const normalizedAppRole = appPerm.role.toLowerCase();
                effectiveRole = normalizedAppRole;
            }

            // 2. Fallback: Check if they own any outlet (True superuser check)
            if (!isAuthorized || (effectiveRole !== "owner" && effectiveRole !== "admin")) {
                const ownedOutlet = await db.query.outlets.findFirst({
                    where: (table, { eq }) => eq(table.ownerId, session.user.id)
                });
                if (ownedOutlet) {
                    isAuthorized = true;
                    effectiveRole = "owner";
                    debugData.ownedOutlet = true;
                }
            }

            // 3. Check Employee record (for role refinement)
            const employee = await db.query.employees.findFirst({
                where: (table, { eq }) => eq(table.userId, session.user.id),
                with: { roleData: true }
            });

            if (employee && employee.isActive) {
                isAuthorized = true;
                const roleData = employee.roleData as any;
                debugData.employee = { id: employee.id, role: employee.role, roleId: employee.roleId };

                // Priority: If user is "owner" or "admin", we maintain that super-role status
                // HOWEVER, if they are an employee we take their specific permissions if they have them.
                const isSuper = effectiveRole === "owner" || effectiveRole === "admin";

                if (roleData && roleData.name) {
                    // Refine effectiveRole to the employee role name unless it's a superuser
                    if (!isSuper) {
                        effectiveRole = roleData.name.toLowerCase();
                    }

                    if (roleData.permissions) {
                        try {
                            permissionsArray = JSON.parse(roleData.permissions);
                        } catch {
                            permissionsArray = [];
                        }
                    } else {
                        permissionsArray = [];
                    }
                } else if (employee.role) {
                    if (!isSuper) {
                        effectiveRole = employee.role.toLowerCase();
                    }
                }
            }
        } catch (e) {
            console.error("Layout DB Error:", e);
        }
    }

    if (!isAuthorized) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-4">
                <div className="rounded-2xl bg-red-100 p-4">
                    <LogOut className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900">Akses Ditolak</h1>
                <p className="max-w-md text-center text-zinc-500">
                    Akun Anda ({session?.user?.email}) tidak memiliki izin untuk mengakses dashboard ini.
                    Hubungi administrator atau pemilik outlet jika Anda merasa ini adalah kesalahan.
                </p>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 text-xs font-mono text-zinc-500 overflow-auto max-w-lg mb-4">
                    <p className="font-bold mb-2 border-b pb-1 text-zinc-700 uppercase">Diagnostic Dashboard</p>
                    {JSON.stringify({
                        role: effectiveRole,
                        isAuthorized,
                        hasDynamicPerms: permissionsArray !== undefined,
                        permsCount: permissionsArray?.length ?? 0,
                        debug: debugData
                    }, null, 2)}
                </div>

                <LogoutButton className="rounded-lg bg-white px-4 py-2 font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50">
                    Keluar & Gunakan Akun Lain
                </LogoutButton>
            </div>
        );
    }

    // Fetch Outlets and Active Cookie
    const outlets = await getOutlets();
    const cookieStore = await cookies();
    let activeOutletId = cookieStore.get("active_outlet_id")?.value;

    // Auto-select first outlet if none selected and outlets exist
    if (!activeOutletId && outlets.length > 0) {
        activeOutletId = outlets[0].id;
        // We can't set cookie in Server Component directly without Server Action or Middleware usually,
        // but passing it as initialActiveId to Provider handles the state.
        // The provider will need to sync it to cookie if we want persistence.
    }

    return (
        <OutletProvider initialOutlets={outlets} initialActiveId={activeOutletId}>
            <BrandingProvider>
                <div className="flex min-h-screen bg-zinc-100">
                    <DashboardSidebar user={session.user} role={effectiveRole} permissions={permissionsArray}>
                        <PermissionGuard role={effectiveRole} permissions={permissionsArray}>
                            {children}
                        </PermissionGuard>
                    </DashboardSidebar>
                </div>
            </BrandingProvider>
        </OutletProvider>
    );
}

