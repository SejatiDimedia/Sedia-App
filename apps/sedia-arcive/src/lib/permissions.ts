import { db, appPermission, eq, and, sql } from "@shared-db";

const APP_ID = "sedia-arcive";
const DEFAULT_STORAGE_LIMIT = 524288000; // 500 MB
const MAX_FILE_SIZE = 104857600; // 100 MB

export interface UserPermission {
    id: string;
    userId: string;
    appId: string;
    role: string;
    uploadEnabled: boolean;
    storageLimit: number;
    maxFileSize?: number;
    storageUsed: number;
}

/**
 * Get or create user permission for SediaArcive
 */
export async function getUserPermission(userId: string): Promise<UserPermission> {
    // Try to find existing permission
    const existing = await db
        .select()
        .from(appPermission)
        .where(
            and(
                eq(appPermission.userId, userId),
                eq(appPermission.appId, APP_ID)
            )
        )
        .limit(1);

    if (existing.length > 0) {
        const p = existing[0] as UserPermission;

        // Fetch max_file_size manually
        try {
            const raw = await db.execute(sql`SELECT max_file_size FROM sedia_auth.app_permission WHERE id = ${p.id}`);
            if (raw.rows.length > 0 && raw.rows[0].max_file_size) {
                p.maxFileSize = Number(raw.rows[0].max_file_size);
            } else {
                p.maxFileSize = MAX_FILE_SIZE;
            }
        } catch (e) {
            console.error("Failed to fetch max_file_size:", e);
            p.maxFileSize = MAX_FILE_SIZE;
        }

        return p;
    }

    // Create new permission record with defaults
    const newPermission = await db
        .insert(appPermission)
        .values({
            userId,
            appId: APP_ID,
            role: "user",
            uploadEnabled: false,
            storageLimit: DEFAULT_STORAGE_LIMIT,
            // maxFileSize: MAX_FILE_SIZE,
            storageUsed: 0,
        })
        .returning();

    const p = newPermission[0] as UserPermission;
    p.maxFileSize = MAX_FILE_SIZE;
    return p;
}

/**
 * Update storage used for a user
 */
export async function updateStorageUsed(userId: string, additionalBytes: number): Promise<void> {
    const permission = await getUserPermission(userId);

    await db
        .update(appPermission)
        .set({
            storageUsed: permission.storageUsed + additionalBytes,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(appPermission.userId, userId),
                eq(appPermission.appId, APP_ID)
            )
        );
}

/**
 * Decrease storage used (when file is deleted)
 */
export async function decreaseStorageUsed(userId: string, bytes: number): Promise<void> {
    const permission = await getUserPermission(userId);
    const newUsed = Math.max(0, permission.storageUsed - bytes);

    await db
        .update(appPermission)
        .set({
            storageUsed: newUsed,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(appPermission.userId, userId),
                eq(appPermission.appId, APP_ID)
            )
        );
}

/**
 * Validate if user can upload a file
 */
export function validateUpload(permission: UserPermission, fileSize: number): { valid: boolean; error?: string } {
    // Check if upload is enabled
    if (!permission.uploadEnabled) {
        return {
            valid: false,
            error: "Upload tidak diizinkan. Hubungi admin untuk aktivasi fitur upload.",
        };
    }

    // Check file size limit
    const limit = permission.maxFileSize || MAX_FILE_SIZE;
    if (fileSize > limit) {
        return {
            valid: false,
            error: `File size exceeds the maximum limit of ${limit / (1024 * 1024)} MB per file.`,
        };
    }

    // Check storage quota
    const projectedUsage = permission.storageUsed + fileSize;
    if (projectedUsage > permission.storageLimit) {
        const remaining = permission.storageLimit - permission.storageUsed;
        return {
            valid: false,
            error: `Insufficient storage quota. Remaining: ${(remaining / (1024 * 1024)).toFixed(1)} MB.`,
        };
    }

    return { valid: true };
}

export { APP_ID, DEFAULT_STORAGE_LIMIT, MAX_FILE_SIZE };
