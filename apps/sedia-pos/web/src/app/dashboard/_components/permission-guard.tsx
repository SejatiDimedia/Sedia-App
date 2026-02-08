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
    "/pos": "access_pos",
    "/dashboard/transactions": "access_pos",
    "/dashboard/customers": "manage_customers",
    "/dashboard/settings/loyalty": "manage_customers",
    "/dashboard/products": "manage_products",
    "/dashboard/categories": "manage_products",
    "/dashboard/inventory/opname": "manage_stock_opname",
    "/dashboard/inventory": "manage_inventory",
    "/dashboard/employees": "manage_employees",
    "/dashboard/reports": "view_reports",
    "/dashboard/settings": "manage_settings",
    "/dashboard/tax": "manage_tax",
    "/dashboard/outlets": "manage_outlets",
    "/dashboard/activity": "view_reports",
    "/dashboard/purchase-orders": "manage_purchase_orders",
    "/dashboard/suppliers": "manage_suppliers",
};

export default function PermissionGuard({ children, role, permissions }: PermissionGuardProps) {
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

        // 2. Identify required permission for current path
        let requiredPermission = null;
        for (const [route, perm] of Object.entries(REQUIRED_PERMISSIONS)) {
            if (pathname === route || pathname.startsWith(`${route}/`)) {
                requiredPermission = perm;
                break;
            }
        }

        if (requiredPermission) {
            // 3. Dynamic Permissions Check (Primary)
            // If permissions is an array, it's the specific source of truth
            if (permissions && Array.isArray(permissions)) {
                setIsAuthorized(permissions.includes(requiredPermission));
                return;
            }

            // 4. Fallback to Legacy Roles (only if permissions array is missing)


            if (normalizedRole === "cashier" || normalizedRole === "kasir") {
                // Modified for strictness: Legacy cashier only gets POS. 
                // To get more features, user MUST use a Custom Role.
                const allowedForCashier = ["access_pos"];
                if (allowedForCashier.includes(requiredPermission)) {
                    setIsAuthorized(true);
                } else {
                    setIsAuthorized(false);
                }
                return;
            }

            // Deny by default for unknown roles with no permissions
            setIsAuthorized(false);
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
