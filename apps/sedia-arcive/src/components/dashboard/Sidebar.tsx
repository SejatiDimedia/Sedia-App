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
    mobileMenuOpen?: boolean;
    onMobileClose?: () => void;
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
        key: "starred",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        ),
        label: "Starred",
        href: "/dashboard/starred",
    },
    {
        key: "shared",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
        ),
        label: "Shared",
        href: "/dashboard/shared",
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
        key: "trash",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ),
        label: "Trash",
        href: "/dashboard/trash",
    },
    {
        key: "activity",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        label: "Activity",
        href: "/dashboard/activity",
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

export default function Sidebar({ activePage = "dashboard", onCollapsedChange, mobileMenuOpen = false, onMobileClose }: SidebarProps) {
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
        <>
            {/* Mobile Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={onMobileClose}
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-screen z-50 font-sans bg-white border-r border-gray-200 transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
                    } ${collapsed ? "md:w-16" : "md:w-64"} w-64`}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className={`flex items-center h-16 border-b border-gray-100 ${collapsed ? "md:justify-center md:px-2" : "justify-between px-4"}`}>
                        <div className={`flex items-center gap-2 ${collapsed ? "md:justify-center md:w-full" : ""}`}>
                            {!collapsed ? (
                                <span className="flex items-center gap-0.5 text-xl tracking-tight">
                                    <span className="font-extrabold text-sky-600">Sedia</span>
                                    <span className="font-normal text-slate-600">Arcive</span>
                                    <span className="text-sky-500 font-bold mb-2 text-2xl">.</span>
                                </span>
                            ) : (
                                <>
                                    <span className="md:hidden flex items-center gap-0.5 text-xl tracking-tight">
                                        <span className="font-extrabold text-sky-600">Sedia</span>
                                        <span className="font-normal text-slate-600">Arcive</span>
                                    </span>
                                    <span className="hidden md:flex items-center justify-center font-black text-xl tracking-tight">
                                        <span className="text-sky-600">S</span>
                                        <span className="text-slate-600">A</span>
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Close button for mobile */}
                        <button
                            onClick={onMobileClose}
                            className="md:hidden p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Collapse button for desktop */}
                        {!collapsed && (
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className="hidden md:block p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
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
                                    onClick={onMobileClose} // Close menu on click (mobile)
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
                                    <span className={`text-sm ${collapsed ? "md:hidden" : "block"}`}>{item.label}</span>
                                </a>
                            );
                        })}
                    </nav>

                    {/* User */}
                    <div className={`${collapsed ? "md:p-2 md:justify-center" : "p-4"} border-t border-gray-100 transition-all duration-300`}>
                        {isPending ? (
                            <div className={`flex items-center gap-3 ${collapsed ? "md:justify-center md:w-full" : ""}`}>
                                <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                                <div className={`flex-1 space-y-2 ${collapsed ? "md:hidden" : ""}`}>
                                    <div className="h-3 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-2 bg-gray-200 rounded animate-pulse w-3/4" />
                                </div>
                            </div>
                        ) : session?.user ? (
                            <div className={`flex items-center gap-3 ${collapsed ? "md:justify-center md:w-full" : ""}`}>
                                {session.user.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || "User"}
                                        className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-medium text-gray-600">
                                            {session.user.name?.charAt(0) || "U"}
                                        </span>
                                    </div>
                                )}
                                <div className={`flex-1 min-w-0 ${collapsed ? "md:hidden" : ""}`}>
                                    <p className="text-sm font-medium truncate text-gray-900">{session.user.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                                </div>
                            </div>
                        ) : (
                            <a
                                href="/login"
                                className={`flex items-center gap-2 bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors text-sm font-medium text-white ${collapsed ? "md:justify-center md:p-2" : "justify-center px-3 py-2"
                                    }`}
                            >
                                <span className={collapsed ? "md:hidden" : ""}>Sign In</span>
                                {collapsed && (
                                    <svg className="hidden md:block w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                )}
                            </a>
                        )}
                    </div>
                </div>

                {/* Toggle Button for Collapsed State (Detached and positioned relative to parent aside) - Desktop Only */}
                {collapsed && (
                    <button
                        onClick={() => setCollapsed(false)}
                        className="hidden md:flex absolute top-8 left-full -translate-x-1/2 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] text-gray-500 hover:text-sky-600 hover:border-sky-300 transition-all z-[60] items-center justify-center cursor-pointer hover:scale-110"
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
        </>
    );
}
