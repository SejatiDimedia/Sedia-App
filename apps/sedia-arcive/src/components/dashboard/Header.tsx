import { useSession, signOut } from "../../lib/auth-client";
import SearchResults from "./SearchResults";

interface HeaderProps {
    title: string;
    breadcrumbs?: { label: string; href?: string }[];
}

export default function Header({ title, breadcrumbs = [] }: HeaderProps) {
    const { data: session, isPending } = useSession();

    const handleSignOut = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    window.location.href = "/";
                },
            },
        });
    };

    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-zinc-100">
            <div className="flex items-center justify-between h-16 px-6">
                {/* Breadcrumbs & Title */}
                <div>
                    {breadcrumbs.length > 0 && (
                        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
                            {breadcrumbs.map((crumb, index) => (
                                <span key={crumb.label} className="flex items-center gap-2">
                                    {crumb.href ? (
                                        <a href={crumb.href} className="hover:text-zinc-900 transition-colors">
                                            {crumb.label}
                                        </a>
                                    ) : (
                                        <span>{crumb.label}</span>
                                    )}
                                    {index < breadcrumbs.length - 1 && (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </span>
                            ))}
                        </nav>
                    )}
                    <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <SearchResults />

                    {/* Notifications */}
                    <button className="relative p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-500 rounded-full"></span>
                    </button>

                    {/* Profile Dropdown */}
                    {isPending ? (
                        <div className="w-8 h-8 rounded-full bg-zinc-200 animate-pulse" />
                    ) : session?.user ? (
                        <div className="relative group">
                            <button className="flex items-center gap-2 p-1.5 hover:bg-zinc-100 rounded-lg transition-colors">
                                {session.user.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || "User"}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
                                        <span className="text-white text-sm font-medium">
                                            {session.user.name?.charAt(0) || "U"}
                                        </span>
                                    </div>
                                )}
                                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                <div className="px-4 py-3 border-b border-zinc-100">
                                    <p className="text-sm font-medium text-zinc-900 truncate">{session.user.name}</p>
                                    <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
                                </div>
                                <div className="py-1">
                                    <a href="/dashboard/settings" className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">Settings</a>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <a
                            href="/login"
                            className="px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors"
                        >
                            Sign In
                        </a>
                    )}
                </div>
            </div>
        </header>
    );
}
