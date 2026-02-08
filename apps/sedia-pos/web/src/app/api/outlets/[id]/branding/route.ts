
import { db } from "@/lib/db";
import { outlets } from "@/lib/schema/sedia-pos";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { primaryColor, secondaryColor } = body;

        // Check if outlet exists
        const outlet = await db.query.outlets.findFirst({
            where: eq(outlets.id, id),
        });

        if (!outlet) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // PERMISSION CHECK:
        // Allow if:
        // 1. User is the Owner
        // 2. User is an Employee assigned to this outlet

        const isOwner = outlet.ownerId === session.user.id;
        let isAuthorized = isOwner;

        if (!isAuthorized) {
            // Check if user is an assigned employee
            const employee = await db.query.employees.findFirst({
                where: (table, { eq, and }) => and(
                    eq(table.userId, session.user.id),
                    eq(table.isDeleted, false)
                ),
                with: {
                    employeeOutlets: true
                }
            });

            if (employee) {
                // Check legacy single outlet assignment
                if (employee.outletId === id) isAuthorized = true;
                // Check multi-outlet assignment
                if (employee.employeeOutlets.some(eo => eo.outletId === id)) isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await db.update(outlets)
            .set({
                primaryColor,
                secondaryColor,
            })
            .where(eq(outlets.id, id));

        // Revalidate dashboard layout to reflect new colors
        revalidatePath("/dashboard", "layout");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[OUTLET_BRANDING_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
