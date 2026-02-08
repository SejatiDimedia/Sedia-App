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
    ChevronDown,
    Check,
    Truck,
    UsersRound,
} from "lucide-react";
import { useOutlet } from "@/providers/outlet-provider";

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
    { href: "/dashboard/categories", label: "Kategori", icon: LayoutDashboard }, // Using LayoutDashboard or Boxes? Boxes is used for inventory.
    { href: "/dashboard/inventory", label: "Inventaris", icon: Boxes },
    { href: "/dashboard/suppliers", label: "Supplier", icon: Truck },
    { href: "/dashboard/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
    { href: "/dashboard/inventory/opname", label: "Stock Opname", icon: ClipboardList },
    { href: "/dashboard/transactions", label: "Transaksi", icon: BarChart3 },
    { href: "/dashboard/activity", label: "Log Aktivitas", icon: History },
    { href: "/dashboard/customers", label: "Pelanggan", icon: Users },
    { href: "/dashboard/reports", label: "Laporan", icon: BarChart3 },
    { href: "/dashboard/shifts", label: "Laporan Shift", icon: History },
    { href: "/dashboard/tax", label: "Pajak & Biaya", icon: Percent },
    { href: "/dashboard/users", label: "Manajemen User", icon: UsersRound, adminOnly: true },
    { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];

export default function DashboardSidebar({ children, user, role = "cashier", permissions }: DashboardSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // Outlet Context
    const { outlets, activeOutlet, switchOutlet, isLoading } = useOutlet();
    const [outletMenuOpen, setOutletMenuOpen] = useState(false);
    const outletMenuRef = useRef<HTMLDivElement>(null);

    // Close outlet menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (outletMenuRef.current && !outletMenuRef.current.contains(event.target as Node)) {
                setOutletMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        const normalizedRole = role?.toLowerCase();

        // Special restriction for Activity Log (Admin/Owner only)
        if (item.href === "/dashboard/activity" && normalizedRole !== "admin" && normalizedRole !== "owner") {
            return false;
        }

        // User Management is Admin-only
        if ((item as any).adminOnly && normalizedRole !== "admin" && normalizedRole !== "owner") {
            return false;
        }

        if (item.href === "/dashboard") return true;

        // 1. Admin/Owner Bypass (Highest priority)
        if (normalizedRole === "admin" || normalizedRole === "owner") return true;

        // 2. Dynamic Permission Check (Primary source of truth for custom roles)
        if (permissions && Array.isArray(permissions)) {
            const requiredPerms: Record<string, string> = {
                "/pos": "access_pos",
                "/dashboard/transactions": "access_pos",
                "/dashboard/customers": "manage_customers",
                "/dashboard/products": "manage_products",
                "/dashboard/categories": "manage_products",
                "/dashboard/inventory": "manage_inventory",
                "/dashboard/suppliers": "manage_suppliers",
                "/dashboard/purchase-orders": "manage_purchase_orders",
                "/dashboard/inventory/opname": "manage_stock_opname",
                "/dashboard/employees": "manage_employees",
                "/dashboard/reports": "view_reports",
                "/dashboard/shifts": "view_reports",
                "/dashboard/tax": "manage_tax",
                "/dashboard/outlets": "manage_outlets",
                "/dashboard/activity": "view_reports",
                // Settings is now public (filtered internally)
            };

            // Special case: Settings is always visible if user has any role/permissions
            if (item.href === "/dashboard/settings") return true;

            const req = requiredPerms[item.href];

            // If route needs permission, strictly check it.
            if (req) {
                return permissions.includes(req);
            }

            return false;
        }

        // 3. Fallback to Legacy Roles (only if NO dynamic permissions array)


        if (normalizedRole === "cashier" || normalizedRole === "kasir" || normalizedRole === "user") {
            const allowedForCashier = [
                "/pos",
                "/dashboard/transactions",
                "/dashboard/settings"
            ];
            return allowedForCashier.includes(item.href);
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

                    {/* Outlet Switcher */}
                    {!isCollapsed && outlets.length > 0 && (
                        <div className="px-3 py-2">
                            <div className="relative" ref={outletMenuRef}>
                                <button
                                    onClick={() => outlets.length > 1 && setOutletMenuOpen(!outletMenuOpen)}
                                    disabled={outlets.length <= 1}
                                    className={`flex w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2 text-left shadow-sm transition-all hover:bg-zinc-50 ${outlets.length > 1 ? "cursor-pointer" : "cursor-default"
                                        }`}
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                                        <Store className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="truncate text-xs font-medium text-zinc-500 uppercase">Outlet Aktif</p>
                                        <p className="truncate text-sm font-bold text-zinc-900 leading-tight">
                                            {activeOutlet?.name || "Pilih Outlet"}
                                        </p>
                                    </div>
                                    {outlets.length > 1 && (
                                        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${outletMenuOpen ? "rotate-180" : ""}`} />
                                    )}
                                </button>

                                {/* Dropdown */}
                                {outletMenuOpen && (
                                    <div className="absolute left-0 top-full z-50 mt-1 w-full animate-in fade-in zoom-in-95 duration-100">
                                        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg ring-1 ring-black/5">
                                            <div className="max-h-60 overflow-y-auto p-1">
                                                {outlets.map((outlet) => (
                                                    <button
                                                        key={outlet.id}
                                                        onClick={() => {
                                                            switchOutlet(outlet.id);
                                                            setOutletMenuOpen(false);
                                                        }}
                                                        disabled={isLoading}
                                                        className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors ${activeOutlet?.id === outlet.id
                                                            ? "bg-orange-50 text-orange-900"
                                                            : "text-zinc-700 hover:bg-zinc-50"
                                                            }`}
                                                    >
                                                        <span className="truncate font-medium">{outlet.name}</span>
                                                        {activeOutlet?.id === outlet.id && (
                                                            <Check className="h-4 w-4 text-orange-600" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
            </aside >

            {/* Main Content */}
            < div className="flex flex-1 flex-col" >
                {/* Top Bar */}
                < header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-zinc-200 bg-white px-4 lg:px-6" >
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
                </header >

                {/* Page Content */}
                < main className="flex-1 p-4 lg:p-6" > {children}</main >
            </div >
        </>
    );
}
