import { db } from "./db";
import { activityLogs } from "./schema/sedia-pos";
import { auth } from "./auth";
import { headers } from "next/headers";

export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VOID' | 'LOGIN' | 'LOGOUT' | 'ADJUST';
export type ActivityEntityType = 'PRODUCT' | 'TRANSACTION' | 'SHIFT' | 'EMPLOYEE' | 'OUTLET' | 'CATEGORY' | 'CUSTOMER';

interface LogOptions {
    outletId?: string;
    userId?: string;
    userName?: string;
    action: ActivityAction;
    entityType: ActivityEntityType;
    entityId?: string;
    description: string;
    metadata?: any;
}

/**
 * Logs an activity to the database.
 * If userId/userName are not provided, it attempts to fetch them from the current session.
 */
export async function logActivity(options: LogOptions) {
    try {
        let { userId, userName } = options;

        if (!userId) {
            const session = await auth.api.getSession({
                headers: await headers(),
            });
            if (session?.user) {
                userId = session.user.id;
                userName = session.user.name;
            }
        }

        if (!userId) {
            console.warn("logActivity: No userId found for log:", options.description);
            userId = "system";
            userName = "System";
        }

        await db.insert(activityLogs).values({
            outletId: options.outletId,
            userId,
            userName,
            action: options.action,
            entityType: options.entityType,
            entityId: options.entityId,
            description: options.description,
            metadata: options.metadata,
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}
