import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/logging";
import { uploadFile, generateFileKey } from "@/lib/storage";
import { generateBackupData } from "@/lib/backup-service";

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const exportData = await generateBackupData(userId);

        if (!exportData.data || Object.keys(exportData.data).length === 0) {
            return NextResponse.json(exportData);
        }

        // Create a backup record in DB
        await db.insert(posSchema.backups).values({
            outletId: exportData.data?.outlets?.[0]?.id || "unknown",
            userId: userId,
            fileName: `backup-${new Date().getTime()}.json`,
            type: 'export',
            status: 'completed',
            metadata: JSON.stringify({
                outletCount: exportData.data?.outlets?.length || 0,
                productCount: exportData.data?.products?.length || 0,
                transactionCount: exportData.data?.transactions?.length || 0
            })
        });

        return NextResponse.json(exportData);

    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
    }
}
