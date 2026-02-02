import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get("outletId");

        let query = db
            .select()
            .from(posSchema.activityLogs)
            .orderBy(desc(posSchema.activityLogs.createdAt));

        if (outletId) {
            // @ts-ignore - outletId is nullable in schema but we filter if provided
            query = query.where(eq(posSchema.activityLogs.outletId, outletId));
        }

        const logs = await query.limit(100);

        return NextResponse.json(logs);
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        return NextResponse.json(
            { error: "Failed to fetch activity logs" },
            { status: 500 }
        );
    }
}
