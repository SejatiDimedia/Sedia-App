import { NextResponse } from "next/server";
import { db, posSchema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/logging";
import { uploadFile, generateFileKey } from "@/lib/storage";
import { generateBackupData } from "@/lib/backup-service";

// GET /api/settings/backup/cloud - List all backups
export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const backups = await db
            .select()
            .from(posSchema.backups)
            .where(eq(posSchema.backups.userId, session.user.id))
            .orderBy(desc(posSchema.backups.createdAt));

        return NextResponse.json(backups);
    } catch (error) {
        console.error("List backups error:", error);
        return NextResponse.json({ error: "Failed to list backups" }, { status: 500 });
    }
}

// POST /api/settings/backup/cloud - Trigger cloud backup
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Fetch data similar to export (Simplified: we use an internal function or just re-implement)
        // For efficiency, usually we would trigger a background task, but for now we do it inline.

        // We can't easily call our own GET route from here efficiently without fetch, 
        // so we'll just implement the data gathering or reuse a shared helper.

        // Re-using the logic from export/route.ts (ideally this would be a shared service)
        const userId = session.user.id;
        const backupData = await generateBackupData(userId);

        if (!backupData.data || Object.keys(backupData.data).length === 0) {
            return NextResponse.json({ error: "No data found to backup" }, { status: 400 });
        }

        const jsonString = JSON.stringify(backupData);

        const fileName = `backup-${new Date().getTime()}.json`;
        const fileKey = generateFileKey(session.user.id, 'cloud', fileName);

        // 2. Upload to R2
        if (!process.env.R2_ACCESS_KEY_ID) {
            return NextResponse.json({
                error: "Cloud Storage not configured (R2_ACCESS_KEY_ID missing)"
            }, { status: 503 });
        }

        const { url } = await uploadFile(
            fileKey,
            jsonString,
            'application/json'
        );

        // 3. Save to DB
        const [newBackup] = await db.insert(posSchema.backups).values({
            outletId: backupData.data?.outlets?.[0]?.id || "unknown",
            userId: session.user.id,
            fileName: fileName,
            fileUrl: url,
            fileSize: Buffer.byteLength(jsonString),
            type: 'auto',
            status: 'completed',
            metadata: JSON.stringify({
                version: backupData.version,
                tableCounts: {
                    products: backupData.data?.products?.length || 0,
                    transactions: backupData.data?.transactions?.length || 0
                }
            })
        }).returning();

        await logActivity({
            action: 'BACKUP',
            entityType: 'SETTINGS',
            entityId: newBackup.id,
            description: `Berhasil membuat backup cloud: ${fileName}`,
            metadata: { backupId: newBackup.id }
        });

        return NextResponse.json(newBackup);

    } catch (error) {
        console.error("Cloud backup error:", error);
        return NextResponse.json({ error: "Failed to create cloud backup" }, { status: 500 });
    }
}
