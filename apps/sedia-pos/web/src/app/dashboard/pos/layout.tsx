import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export default async function POSLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // POS has its own fullscreen layout, no sidebar wrapper needed
    return (
        <div className="min-h-screen bg-zinc-100">
            {children}
        </div>
    );
}
