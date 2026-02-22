"use client";

import { authClient } from "@/lib/auth-client";
import { LogIn, LogOut, User } from "lucide-react";

export function UserAuthMenu() {
    const { data: session, isPending } = authClient.useSession();

    if (isPending) {
        return (
            <div className="h-9 w-24 animate-pulse rounded-full bg-secondary/50"></div>
        );
    }

    if (session?.user) {
        return (
            <div className="flex items-center gap-3">
                {session.user.image ? (
                    <img
                        src={session.user.image}
                        alt={session.user.name || "User avatar"}
                        className="h-9 w-9 rounded-full border border-secondary/50 object-cover shadow-sm"
                    />
                ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-5 w-5" />
                    </div>
                )}
                <button
                    onClick={() => authClient.signOut()}
                    className="flex items-center gap-2 rounded-full border border-secondary/50 bg-white px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-secondary/20 dark:bg-white/5 dark:hover:bg-white/10"
                >
                    <LogOut className="h-4 w-4" />
                    Keluar
                </button>
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
