"use server";

import { db } from "@/lib/db";
import { outlets, employees } from "@/lib/schema/sedia-pos";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getOutlets() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        return [];
    }

    // 1. Check if user is an owner
    const ownedOutlets = await db.query.outlets.findMany({
        where: eq(outlets.ownerId, session.user.id),
    });

    if (ownedOutlets.length > 0) {
        return ownedOutlets;
    }

    // 2. Check if user is an employee - check junction table first
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

    if (employee) {
        // Get outlets from junction table
        const assignedOutlets = employee.employeeOutlets
            ?.map(eo => eo.outlet)
            .filter(Boolean) || [];

        if (assignedOutlets.length > 0) {
            return assignedOutlets;
        }

        // Fallback to legacy single outlet
        if (employee.outlet) {
            return [employee.outlet];
        }
    }

    return [];
}

