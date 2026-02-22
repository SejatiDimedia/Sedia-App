"use client";

import { authClient } from "@/lib/auth-client";
import { LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function UserAuthMenu() {
    const { data: session, isPending } = authClient.useSession();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (isPending) {
        return (
            <div className="h-9 w-24 animate-pulse rounded-full bg-secondary/50"></div>
        );
    }

    if (session?.user) {
        return (
            <div className="relative flex items-center" ref={menuRef}>
                {/* Profile Trigger */}
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 cursor-pointer py-1 select-none"
                >
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-xs font-bold text-foreground/80 leading-none">{session.user.name}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">Terhubung</span>
                    </div>
                    <div className="relative">
                        {session.user.image ? (
                            <img
                                src={session.user.image}
                                alt={session.user.name || "User avatar"}
                                className={`h-9 w-9 rounded-full border border-secondary/50 object-cover shadow-sm transition-transform ${isOpen ? 'scale-110 ring-2 ring-primary/20' : ''}`}
                            />
                        ) : (
                            <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary border border-secondary/50 transition-transform ${isOpen ? 'scale-110 ring-2 ring-primary/20' : ''}`}>
                                <User className="h-5 w-5" />
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white border border-secondary/30 shadow-sm sm:hidden">
                            <ChevronDown className={`h-2.5 w-2.5 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                </div>

                {/* Dropdown Menu (Logout) */}
                <div className={`absolute right-0 top-full pt-2 transition-all duration-200 z-50 ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}>
                    <div className="w-40 overflow-hidden rounded-xl border border-secondary/30 bg-white p-1 shadow-xl dark:bg-background">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                authClient.signOut();
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        >
                            <LogOut className="h-4 w-4" />
                            Keluar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={async () => {
                await authClient.signIn.social({
                    provider: "google",
                }, {
                    onError: (ctx) => {
                        console.error("BetterAuth Login Error:", ctx.error);
                        alert(`Gagal login: ${ctx.error.message}`);
                    }
                });
            }}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
        >
            <LogIn className="h-4 w-4" />
            Masuk
        </button>
    );
}
