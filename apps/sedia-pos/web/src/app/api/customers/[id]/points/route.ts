import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// POST /api/customers/[id]/points - Add or redeem points
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { action, amount, transactionAmount } = body;

        // Get current customer
        const [customer] = await db
            .select()
            .from(posSchema.customers)
            .where(eq(posSchema.customers.id, id));

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        let pointsChange = 0;
        let newTotalSpent = parseFloat(customer.totalSpent || "0");

        if (action === "earn") {
            // Earn points: 1 point per Rp 10,000
            const earnedPoints = Math.floor((transactionAmount || 0) / 10000);
            pointsChange = earnedPoints;
            newTotalSpent += transactionAmount || 0;
        } else if (action === "redeem") {
            // Redeem points
            if ((customer.points || 0) < amount) {
                return NextResponse.json(
                    { error: "Insufficient points" },
                    { status: 400 }
                );
            }
            pointsChange = -amount;
        } else if (action === "add") {
            // Manual add points
            pointsChange = amount;
        } else if (action === "subtract") {
            // Manual subtract points
            pointsChange = -Math.min(amount, customer.points || 0);
        } else {
            return NextResponse.json(
                { error: "Invalid action. Use: earn, redeem, add, or subtract" },
                { status: 400 }
            );
        }

        const newPoints = Math.max(0, (customer.points || 0) + pointsChange);

        // Update customer
        const [updatedCustomer] = await db
            .update(posSchema.customers)
            .set({
                points: newPoints,
                totalSpent: String(newTotalSpent),
            })
            .where(eq(posSchema.customers.id, id))
            .returning();

        return NextResponse.json({
            success: true,
            previousPoints: customer.points,
            pointsChange,
            newPoints: updatedCustomer.points,
            totalSpent: updatedCustomer.totalSpent,
        });
    } catch (error) {
        console.error("Error updating points:", error);
        return NextResponse.json(
            { error: "Failed to update points" },
            { status: 500 }
        );
    }
}

// OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
