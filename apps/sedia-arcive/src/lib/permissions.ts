import { db, appPermission, eq, and } from "@shared-db";

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
        return existing[0] as UserPermission;
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
            storageUsed: 0,
        })
        .returning();

    return newPermission[0] as UserPermission;
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

    // Check file size limit (100 MB)
    if (fileSize > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `Ukuran file melebihi batas maksimal ${MAX_FILE_SIZE / (1024 * 1024)} MB per file.`,
        };
    }

    // Check storage quota
    const projectedUsage = permission.storageUsed + fileSize;
    if (projectedUsage > permission.storageLimit) {
        const remaining = permission.storageLimit - permission.storageUsed;
        return {
            valid: false,
            error: `Kuota penyimpanan tidak cukup. Tersisa: ${(remaining / (1024 * 1024)).toFixed(1)} MB.`,
        };
    }

    return { valid: true };
}

export { APP_ID, DEFAULT_STORAGE_LIMIT, MAX_FILE_SIZE };
