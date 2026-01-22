import { db, activityLog, desc, eq } from "@shared-db";

export type ActivityAction =
    | "upload"
    | "delete"
    | "create_folder"
    | "delete_folder"
    | "move";

export type TargetType = "file" | "folder";

interface LogActivityParams {
    userId: string;
    action: ActivityAction;
    targetType: TargetType;
    targetId: string;
    targetName: string;
    metadata?: Record<string, unknown>;
}

/**
 * Log a user activity
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
    try {
        await db.insert(activityLog).values({
            userId: params.userId,
            action: params.action,
            targetType: params.targetType,
            targetId: params.targetId,
            targetName: params.targetName,
            metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // Don't throw - activity logging should not break the main flow
    }
}

interface ActivityRecord {
    id: string;
    userId: string;
    action: string;
    targetType: string;
    targetId: string;
    targetName: string;
    metadata: string | null;
    createdAt: Date;
}

/**
 * Get recent activities for a user
 */
export async function getUserActivities(userId: string, limit = 20): Promise<ActivityRecord[]> {
    const activities = await db
        .select()
        .from(activityLog)
        .where(eq(activityLog.userId, userId))
        .orderBy(desc(activityLog.createdAt))
        .limit(limit);

    return activities as ActivityRecord[];
}
