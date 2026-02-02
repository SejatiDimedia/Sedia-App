"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

interface PermissionGuardProps {
    children: React.ReactNode;
    role?: string;
    permissions?: string[];
}

const REQUIRED_PERMISSIONS: Record<string, string> = {
    "/dashboard/pos": "access_pos",
    "/dashboard/transactions": "access_pos",
    "/dashboard/customers": "manage_customers",
    "/dashboard/settings/loyalty": "manage_customers", // Loyalty = part of customer management
    "/dashboard/products": "manage_products",
    "/dashboard/inventory/opname": "manage_stock_opname",
    "/dashboard/inventory": "manage_inventory",
    "/dashboard/employees": "manage_employees",
    "/dashboard/reports": "view_reports",
    "/dashboard/settings": "manage_settings",
    "/dashboard/outlets": "manage_settings",
};

export default function PermissionGuard({ children, role, permissions = [] }: PermissionGuardProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(true);

    useEffect(() => {
        const normalizedRole = role?.toLowerCase();

        // 1. Admin/Owner always allowed
        if (normalizedRole === "admin" || normalizedRole === "owner") {
            setIsAuthorized(true);
            return;
        }

        // 2. Manager role always allowed (full access like admin)
        if (normalizedRole === "manager") {
            setIsAuthorized(true);
            return;
        }

        // 3. Check Permissions
        // Sort keys by length desc to match most specific paths first (e.g. /dashboard/settings/profile vs /dashboard/settings)
        // actually strict matching for the map keys to the START of the pathname is usually best

        let requiredPermission = null;

        // Find if current pathname starts with any of the protected routes
        for (const [route, perm] of Object.entries(REQUIRED_PERMISSIONS)) {
            if (pathname === route || pathname.startsWith(`${route}/`)) {
                requiredPermission = perm;
                break;
            }
        }

        if (requiredPermission) {
            const hasPermission = permissions.includes(requiredPermission);

            // Legacy/Fallback Roles Logic (if no permissions array or for legacy string roles)
            if (!permissions || permissions.length === 0) {
                if (role === "manager") {
                    setIsAuthorized(true); // Managers usually access everything
                    return;
                }
                if (role === "cashier") {
                    // Cashier allowed only: dashboard, transactions, customers, products, inventory (read mostly? but for now allow access)
                    // explicitly DENY: employees, reports, settings
                    const deniedForCashier = ["manage_employees", "view_reports", "manage_settings", "manage_stock_opname"];
                    if (deniedForCashier.includes(requiredPermission)) {
                        setIsAuthorized(false);
                        return;
                    }
                    setIsAuthorized(true);
                    return;
                }
                // If role is unknown and no permissions -> Deny restricted routes
                setIsAuthorized(false);
                return;
            }

            // Dynamic Permissions Check
            if (hasPermission) {
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }
        } else {
            // Public internal dashboard routes (e.g. /dashboard itself)
            setIsAuthorized(true);
        }

    }, [pathname, role, permissions]);

    if (!isAuthorized) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4 p-8">
                <div className="rounded-full bg-red-100 p-4">
                    <ShieldAlert className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-zinc-900">Akses Ditolak</h2>
                    <p className="mt-2 text-zinc-500">
                        Anda tidak memiliki izin untuk mengakses halaman ini.
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                        Required: {Object.entries(REQUIRED_PERMISSIONS).find(([r]) => pathname.startsWith(r))?.[1]}
                    </p>
                </div>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50"
                >
                    Kembali ke Dashboard
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
