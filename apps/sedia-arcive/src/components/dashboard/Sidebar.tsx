import { useState, useEffect } from "react";
import { useSession } from "../../lib/auth-client";

interface NavItem {
    key: string;
    icon: React.ReactNode;
    label: string;
    href: string;
    adminOnly?: boolean;
}

interface SidebarProps {
    activePage?: string;
    onCollapsedChange?: (collapsed: boolean) => void;
}

const navItems: NavItem[] = [
    {
        key: "dashboard",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
        label: "Dashboard",
        href: "/dashboard",
    },
    {
        key: "files",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
        ),
        label: "Files",
        href: "/dashboard/files",
    },
    {
        key: "uploads",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
        ),
        label: "Uploads",
        href: "/dashboard/uploads",
    },
    {
        key: "team",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
        ),
        label: "Team",
        href: "/dashboard/team",
    },
    {
        key: "admin",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        label: "Admin",
        href: "/dashboard/admin",
        adminOnly: true,
    },
    {
        key: "settings",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        label: "Settings",
        href: "/dashboard/settings",
    },
];

export default function Sidebar({ activePage = "dashboard", onCollapsedChange }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const { data: session, isPending } = useSession();

    useEffect(() => {
        if (onCollapsedChange) {
            onCollapsedChange(collapsed);
        }
    }, [collapsed, onCollapsedChange]);

    // Check if user is admin - cache in sessionStorage for View Transitions
    useEffect(() => {
        const checkAdmin = async () => {
            // First check sessionStorage for cached value
            const cachedRole = sessionStorage.getItem("sedia-arcive-role");
            if (cachedRole) {
                setIsAdmin(cachedRole === "admin");
            }

            // Then fetch fresh data
            try {
                const response = await fetch("/api/stats");
                if (response.ok) {
                    const data = await response.json();
                    const newIsAdmin = data.role === "admin";
                    setIsAdmin(newIsAdmin);
                    // Cache the role
                    sessionStorage.setItem("sedia-arcive-role", data.role || "user");
                }
            } catch {
                // Ignore errors
            }
        };
        checkAdmin();
    }, []);

    const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

    return (
        <aside className="fixed top-0 left-0 h-screen z-50 font-sans w-fit overflow-visible group">
            {/* Main Sidebar Content Container */}
            <div
                className={`h-full bg-white border-r border-gray-200 text-gray-900 transition-all duration-300 flex flex-col ${collapsed ? "w-16" : "w-64"
                    }`}
            >
                {/* Logo */}
                <div className={`flex items-center h-16 border-b border-gray-100 ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
                    <div className={`flex items-center gap-2 ${collapsed ? "justify-center w-full" : ""}`}>
                        {!collapsed ? (
                            <span className="flex items-center gap-0.5 text-xl tracking-tight">
                                <span className="font-extrabold text-sky-600">Sedia</span>
                                <span className="font-normal text-slate-600">Arcive</span>
                                <span className="text-sky-500 font-bold mb-2 text-2xl">.</span>
                            </span>
                        ) : (
                            <span className="flex items-center justify-center font-black text-xl tracking-tight">
                                <span className="text-sky-600">S</span>
                                <span className="text-slate-600">A</span>
                            </span>
                        )}
                    </div>
                    {!collapsed && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
                            aria-label="Collapse sidebar"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
                    {filteredNavItems.map((item) => {
                        const isActive = item.key === activePage;
                        return (
                            <a
                                key={item.key}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                    ? "bg-sky-50 text-sky-600 font-medium"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                                title={collapsed ? item.label : undefined}
                            >
                                {/* Ensure icon stays centered when collapsed */}
                                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                                    {item.icon}
                                </div>
                                {!collapsed && <span className="text-sm">{item.label}</span>}
                            </a>
                        );
                    })}
                </nav>

                {/* User */}
                <div className={`${collapsed ? "p-2 justify-center" : "p-4"} border-t border-gray-100 transition-all duration-300`}>
                    {isPending ? (
                        <div className={`flex items-center gap-3 ${collapsed ? "justify-center w-full" : ""}`}>
                            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                            {!collapsed && (
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-2 bg-gray-200 rounded animate-pulse w-3/4" />
                                </div>
                            )}
                        </div>
                    ) : session?.user ? (
                        <div className={`flex items-center gap-3 ${collapsed ? "justify-center w-full" : ""}`}>
                            {session.user.image ? (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name || "User"}
                                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-medium text-gray-600">
                                        {session.user.name?.charAt(0) || "U"}
                                    </span>
                                </div>
                            )}
                            {!collapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate text-gray-900">{session.user.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <a
                            href="/login"
                            className={`flex items-center gap-2 bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors text-sm font-medium text-white ${collapsed ? "justify-center p-2" : "justify-center px-3 py-2"
                                }`}
                        >
                            {!collapsed && "Sign In"}
                            {collapsed && (
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                            )}
                        </a>
                    )}
                </div>
            </div>

            {/* Toggle Button for Collapsed State (Detached and positioned relative to parent aside) */}
            {collapsed && (
                <button
                    onClick={() => setCollapsed(false)}
                    className="absolute top-8 left-full -translate-x-1/2 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] text-gray-500 hover:text-sky-600 hover:border-sky-300 transition-all z-[60] flex items-center justify-center cursor-pointer hover:scale-110"
                    aria-label="Expand sidebar"
                    style={{ outline: "none" }}
                >
                    <svg
                        className="w-3.5 h-3.5 rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
            )}
        </aside>
    );
}
