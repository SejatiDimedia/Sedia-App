import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { LogOut } from "lucide-react";
import LogoutButton from "@/components/logout-button";
import { getOutlets } from "@/actions/outlets";
import { cookies } from "next/headers";
import { OutletProvider } from "@/providers/outlet-provider";
import { BrandingProvider } from "@/providers/branding-provider";

export default async function POSLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // Check permissions for POS access
    let hasAccess = false;
    let effectiveRole = "unknown";

    if (session?.user?.id) {
        try {
            // 1. Check App Permission (Admin/Owner always have access)
            const appPermission = await db.query.appPermission.findFirst({
                where: (table, { eq, and }) => and(
                    eq(table.userId, session.user.id),
                    eq(table.appId, "sedia-pos")
                )
            });

            if (appPermission?.role === "admin" || appPermission?.role === "owner") {
                hasAccess = true;
                effectiveRole = appPermission.role;
            } else {
                // 2. Check Employee role and permissions
                const employee = await db.query.employees.findFirst({
                    where: (table, { eq }) => eq(table.userId, session.user.id),
                    with: { roleData: true }
                });

                if (employee && employee.isActive) {
                    const roleData = employee.roleData as any;

                    if (roleData && roleData.name) {
                        effectiveRole = roleData.name;

                        // Manager has all access
                        if (roleData.name === "manager") {
                            hasAccess = true;
                        } else if (roleData.permissions) {
                            // Check for access_pos permission
                            try {
                                const permissions = JSON.parse(roleData.permissions);
                                hasAccess = Array.isArray(permissions) && permissions.includes("access_pos");
                            } catch { }
                        }

                        // Legacy cashier role has POS access by default
                        if (roleData.name === "cashier" || roleData.name === "Kasir") {
                            hasAccess = true;
                        }
                    } else if (employee.role) {
                        // Legacy string role
                        effectiveRole = employee.role;
                        if (employee.role === "cashier" || employee.role === "manager") {
                            hasAccess = true;
                        }
                    }
                }
            }
        } catch (e) {
            console.error("POS Layout DB Error:", e);
        }
    }

    if (!hasAccess) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
                <div className="rounded-2xl bg-red-100 p-4">
                    <LogOut className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-xl font-bold text-primary-900">Akses Ditolak</h1>
                <p className="max-w-md text-center text-primary-600">
                    Anda tidak memiliki izin untuk mengakses Mode Kasir (POS).
                </p>
                <p className="text-xs text-primary-400">
                    Role: {effectiveRole} | Required: access_pos
                </p>
                <div className="mt-4 flex gap-3">
                    <a
                        href="/dashboard"
                        className="rounded-xl bg-white px-4 py-2 font-medium text-primary-700 shadow-sm ring-1 ring-primary-200 hover:bg-primary-50"
                    >
                        Kembali ke Dashboard
                    </a>
                    <LogoutButton className="rounded-xl bg-primary-100 px-4 py-2 font-medium text-primary-700 hover:bg-primary-200">
                        Logout
                    </LogoutButton>
                </div>
            </div>
        );
    }

    // Fetch Outlets and Active Cookie for Branding
    const outlets = await getOutlets();
    const cookieStore = await cookies();
    let activeOutletId = cookieStore.get("active_outlet_id")?.value;

    // Auto-select first outlet if none selected and outlets exist
    if (!activeOutletId && outlets.length > 0) {
        activeOutletId = outlets[0].id;
    }

    // Standalone POS layout - no sidebar, fullscreen optimized
    return (
        <OutletProvider initialOutlets={outlets} initialActiveId={activeOutletId}>
            <BrandingProvider>
                {children}
            </BrandingProvider>
        </OutletProvider>
    );
}
