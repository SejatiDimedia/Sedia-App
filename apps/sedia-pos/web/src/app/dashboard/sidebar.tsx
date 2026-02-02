"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Store,
    Boxes,
    ClipboardList,
    History,
    PanelLeftClose,
    PanelLeftOpen,
    Percent,
} from "lucide-react";

interface DashboardSidebarProps {
    children: React.ReactNode;
    user: any;
    role?: string;
    permissions?: string[];
}

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pos", label: "Kasir (POS)", icon: ShoppingCart, external: true },
    { href: "/dashboard/outlets", label: "Outlet", icon: Store },
    { href: "/dashboard/employees", label: "Karyawan", icon: Users },
    { href: "/dashboard/products", label: "Produk", icon: Package },
    { href: "/dashboard/inventory", label: "Inventaris", icon: Boxes },
    { href: "/dashboard/inventory/opname", label: "Stock Opname", icon: ClipboardList },
    { href: "/dashboard/transactions", label: "Transaksi", icon: BarChart3 },
    { href: "/dashboard/activity", label: "Log Aktivitas", icon: History },
    { href: "/dashboard/customers", label: "Pelanggan", icon: Users },
    { href: "/dashboard/reports", label: "Laporan", icon: BarChart3 },
    { href: "/dashboard/tax", label: "Pajak & Biaya", icon: Percent },
    { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];

export default function DashboardSidebar({ children, user, role = "cashier", permissions }: DashboardSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // Close profile menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setProfileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter nav items based on role
    const filteredNavItems = navItems.filter((item) => {
        // 1. Admin/Owner Bypass
        if (role === "admin" || role === "owner") return true;

        // 2. Dynamic Permission Check
        if (permissions && permissions.length > 0) {
            // Check specific permissions per route
            // Define mapping
            const requiredPerms: Record<string, string> = {
                "/pos": "access_pos",
                "/dashboard/transactions": "access_pos",
                "/dashboard/customers": "manage_customers",
                "/dashboard/products": "manage_products",
                "/dashboard/inventory": "manage_inventory",
                "/dashboard/inventory/opname": "manage_inventory",
                "/dashboard/employees": "manage_employees",
                "/dashboard/reports": "view_reports",
                "/dashboard/settings": "manage_settings",
                "/dashboard/tax": "manage_tax",
                // Outlet? Assume "manage_settings" or global
                "/dashboard/outlets": "manage_settings",
                "/dashboard/activity": "view_reports", // Using view_reports as proxy for activity log
            };

            const req = requiredPerms[item.href];

            // If route needs permission, check it.
            if (req) {
                // Special case: customers can also be accessed by 'access_pos' usually?
                // Let's stick to strict 'manage_customers' mapped in roles settings.
                return permissions.includes(req);
            }

            // Dashboard is usually always allowed or basic
            if (item.href === "/dashboard") return true;

            // If no specific requirement defined, maybe default deny or allow?
            // Deny safe.
            return false;
        }

        // 3. Fallback to Legacy Roles (if no permissions found)
        if (role === "manager") {
            return true;
        }

        if (role === "cashier") {
            const allowed = [
                "/dashboard",
                "/pos",
                "/dashboard/transactions",
                // "/dashboard/customers", // Only if explicitly authorized? Legacy cashier had it.
                // Let's keep legacy behavior for 'cashier' string role
                "/dashboard/customers",
                "/dashboard/products",
                "/dashboard/inventory"
            ];
            return allowed.includes(item.href);
        }

        return false;
    });

    const handleLogout = async () => {
        await signOut();
        router.push("/login");
    };

    return (
        <>
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 transform bg-white shadow-xl transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
            >
                <div className="flex h-full flex-col">
                    {/* Logo & Toggle */}
                    <div className={`flex h-16 items-center border-b border-zinc-200 transition-all duration-300 ${isCollapsed ? "justify-center px-2" : "justify-between px-4"}`}>
                        <Link href="/dashboard" className={`flex items-center gap-2 overflow-hidden ${isCollapsed ? "justify-center" : ""}`}>
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-500 shadow-sm">
                                <LayoutDashboard className="h-4 w-4 text-white" />
                            </div>
                            {!isCollapsed && (
                                <span className="text-lg font-bold text-zinc-900 truncate">
                                    Sedia POS
                                </span>
                            )}
                        </Link>

                        {!isCollapsed && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsCollapsed(true)}
                                    className="hidden lg:flex rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-secondary-600 transition-colors"
                                    title="Collapse Sidebar"
                                >
                                    <PanelLeftClose className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 lg:hidden"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        {isCollapsed && (
                            <button
                                onClick={() => setIsCollapsed(false)}
                                className="hidden lg:flex absolute -right-3 top-6 h-6 w-6 items-center justify-center rounded-full bg-white border border-zinc-200 text-secondary-500 shadow-sm hover:text-secondary-600 transition-all z-50 translate-x-1/2"
                                title="Expand Sidebar"
                            >
                                <PanelLeftOpen className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 p-3 overflow-y-auto overflow-x-hidden pt-4">
                        {!isCollapsed && (
                            <div className="mb-2 px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                Menu ({role})
                            </div>
                        )}
                        {filteredNavItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/dashboard" &&
                                    pathname.startsWith(item.href + "/") &&
                                    !filteredNavItems.some(
                                        (other) =>
                                            other.href !== item.href &&
                                            other.href.startsWith(item.href + "/") &&
                                            pathname.startsWith(other.href)
                                    ));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group ${isActive
                                        ? "bg-secondary-50 text-secondary-600 shadow-sm"
                                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                        } ${isCollapsed ? "justify-center px-2" : ""}`}
                                    title={isCollapsed ? item.label : ""}
                                >
                                    <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-secondary-500" : "text-zinc-400 group-hover:text-zinc-600"}`} />
                                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                                    {isActive && !isCollapsed && <ChevronRight className="ml-auto h-4 w-4 shrink-0" />}
                                </Link>
                            );
                        })}
                    </nav>

                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-zinc-200 bg-white px-4 lg:px-6">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 lg:hidden"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="flex-1" />

                    {/* User Info & Profile Dropdown */}
                    <div className="relative" ref={profileMenuRef}>
                        <button
                            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                            className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-zinc-100"
                        >
                            <div className="flex items-center gap-2 mr-2">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-medium text-zinc-900 leading-none">{user?.name}</p>
                                    <p className="text-xs text-zinc-500 mt-1">{user?.email}</p>
                                </div>
                            </div>
                            {user?.image ? (
                                <img src={user.image} alt={user.name} className="h-8 w-8 rounded-full border border-zinc-200" />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 font-bold border border-secondary-200">
                                    {user?.name?.charAt(0) || "U"}
                                </div>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {profileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white p-2 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">
                                <div className="mb-2 px-3 py-2 border-b border-zinc-100 md:hidden">
                                    <p className="text-sm font-medium text-zinc-900 truncate">{user?.name}</p>
                                    <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Keluar
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6">{children}</main>
            </div>
        </>
    );
}
