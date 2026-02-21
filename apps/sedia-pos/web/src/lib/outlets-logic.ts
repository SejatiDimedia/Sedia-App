import { db } from "@/lib/db";
import { outlets, employees } from "@/lib/schema/sedia-pos";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

/**
 * Shared logic to get authorized outlets for a session.
 * Robust enough to be used in Server Actions and API Routes.
 */
export async function getAuthorizedOutlets(headers: Headers) {
    const session = await auth.api.getSession({
        headers,
    });

    if (!session?.user?.id) {
        return [];
    }

    const userId = session.user.id;

    // 1. Get owned outlets
    const ownedOutlets = await db.query.outlets.findMany({
        where: eq(outlets.ownerId, userId),
    });

    // 2. Get employee-assigned outlets
    const employee = await db.query.employees.findFirst({
        where: and(
            eq(employees.userId, userId),
            eq(employees.isDeleted, false)
        ),
        with: {
            outlet: true,
            employeeOutlets: {
                with: {
                    outlet: true
                }
            }
        }
    });

    const outletMap = new Map<string, any>();

    ownedOutlets.forEach(o => outletMap.set(o.id, o));

    if (employee) {
        employee.employeeOutlets?.forEach(eo => {
            if (eo.outlet) outletMap.set(eo.outlet.id, eo.outlet);
        });
        if (employee.outlet) {
            outletMap.set(employee.outlet.id, employee.outlet);
        }
    }

    return Array.from(outletMap.values());
}
