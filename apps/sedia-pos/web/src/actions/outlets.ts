"use server";

import { db } from "@/lib/db";
import { outlets, employees } from "@/lib/schema/sedia-pos";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";

export async function getOutlets() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // Opt out of caching to ensure fresh data for theme/banding updates
    noStore();

    if (!session?.user?.id) {
        return [];
    }

    // 1. Get owned outlets
    const ownedOutlets = await db.query.outlets.findMany({
        where: eq(outlets.ownerId, session.user.id),
    });

    // 2. Get employee-assigned outlets
    const employee = await db.query.employees.findFirst({
        where: and(
            eq(employees.userId, session.user.id),
            eq(employees.isDeleted, false)
        ),
        with: {
            outlet: true, // Legacy single outlet
            employeeOutlets: {
                with: {
                    outlet: true
                }
            }
        }
    });

    const outletMap = new Map<string, any>();

    // Add owned outlets to map
    ownedOutlets.forEach(o => outletMap.set(o.id, o));

    if (employee) {
        // Add outlets from junction table
        employee.employeeOutlets?.forEach(eo => {
            if (eo.outlet) outletMap.set(eo.outlet.id, eo.outlet);
        });

        // Add legacy single outlet
        if (employee.outlet) {
            outletMap.set(employee.outlet.id, employee.outlet);
        }
    }

    return Array.from(outletMap.values());
}

export async function setActiveOutletCookie(outletId: string) {
    const cookieStore = await headers(); // In newer Next.js actions, commonly used with cookies()
    const { cookies } = await import("next/headers");
    (await cookies()).set("active_outlet_id", outletId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
    });
    return { success: true };
}


