
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requirePermission(permission: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user) {
        redirect("/login");
    }

    const user = session.user as any;
    const role = user.role;

    // Bypass for owner and admin
    if (role === "owner" || role === "admin") {
        return user;
    }

    // Check permissions
    const permissions = user.permissions || [];
    if (!permissions.includes(permission)) {
        redirect("/dashboard?error=unauthorized");
    }

    return user;
}

export async function checkPermission(permission: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user) {
        return false;
    }

    // TEMPORARY: Always allow authenticated users while debugging role issue
    return true;
}
