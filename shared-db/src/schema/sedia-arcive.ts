import { pgSchema, text, timestamp, bigint, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth-schema";

// ============================================
// SEDIA ARCIVE - File Storage Application Schema
// ============================================

export const sediaArcive = pgSchema("sedia_arcive");

// ============================================
// Files & Folders
// ============================================

export const folder = sediaArcive.table("folder", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    parentId: text("parent_id"), // null for root folders
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const file = sediaArcive.table("file", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    r2Key: text("r2_key").notNull(), // Cloudflare R2 storage key
    folderId: text("folder_id"), // null for root files
    userId: text("user_id").notNull(),
    // Soft-delete fields for Trash feature
    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// Internal File Sharing (User-to-User)
// ============================================

export const fileAccess = sediaArcive.table("file_access", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    fileId: text("file_id").notNull(),
    sharedWithUserId: text("shared_with_user_id").notNull(),
    permission: text("permission").notNull().default("view"), // "view" | "edit"
    sharedBy: text("shared_by").notNull(),
    sharedAt: timestamp("shared_at").notNull().defaultNow(),
});

// ============================================
// Activity Log
// ============================================

// ============================================
// Internal Folder Sharing (User-to-User)
// ============================================

export const folderAccess = sediaArcive.table("folder_access", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    folderId: text("folder_id").notNull(),
    sharedWithUserId: text("shared_with_user_id").notNull(),
    permission: text("permission").notNull().default("view"), // "view" | "edit"
    sharedBy: text("shared_by").notNull(),
    sharedAt: timestamp("shared_at").notNull().defaultNow(),
});

// ============================================
// Activity Log
// ============================================

export const activityLog = sediaArcive.table("activity_log", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    action: text("action").notNull(), // 'upload', 'delete', 'create_folder', 'delete_folder', 'move', 'share', 'restore', 'permanent_delete'
    targetType: text("target_type").notNull(), // 'file' or 'folder'
    targetId: text("target_id").notNull(),
    targetName: text("target_name").notNull(),
    metadata: text("metadata"), // JSON string for additional data (size, mimeType, sharedWith, etc.)
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// Share Links (Public Sharing)
// ============================================

export const shareLink = sediaArcive.table("share_link", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    token: text("token").notNull().unique(), // Public access token
    targetType: text("target_type").notNull(), // 'file' or 'folder'
    targetId: text("target_id").notNull(),
    password: text("password"), // Optional password (hashed)
    expiresAt: timestamp("expires_at"), // Optional expiration
    allowDownload: text("allow_download").notNull().default("true"), // "true" or "false"
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// Notifications
// ============================================

export const notification = sediaArcive.table("notification", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    type: text("type").notNull(), // 'share_file', 'share_folder', 'download', 'system'
    title: text("title").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    link: text("link"), // Optional action link
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// Relations
// ============================================

export const folderRelations = relations(folder, ({ one, many }) => ({
    parent: one(folder, {
        fields: [folder.parentId],
        references: [folder.id],
    }),
    children: many(folder),
    files: many(file),
    owner: one(user, {
        fields: [folder.userId],
        references: [user.id],
    }),
    sharedWith: many(folderAccess),
}));

export const fileRelations = relations(file, ({ one, many }) => ({
    folder: one(folder, {
        fields: [file.folderId],
        references: [folder.id],
    }),
    owner: one(user, {
        fields: [file.userId],
        references: [user.id],
    }),
    sharedWith: many(fileAccess),
}));

export const fileAccessRelations = relations(fileAccess, ({ one }) => ({
    file: one(file, {
        fields: [fileAccess.fileId],
        references: [file.id],
    }),
    sharedWithUser: one(user, {
        fields: [fileAccess.sharedWithUserId],
        references: [user.id],
    }),
    sharedByUser: one(user, {
        fields: [fileAccess.sharedBy],
        references: [user.id],
    }),
}));

export const folderAccessRelations = relations(folderAccess, ({ one }) => ({
    folder: one(folder, {
        fields: [folderAccess.folderId],
        references: [folder.id],
    }),
    sharedWithUser: one(user, {
        fields: [folderAccess.sharedWithUserId],
        references: [user.id],
    }),
    sharedByUser: one(user, {
        fields: [folderAccess.sharedBy],
        references: [user.id],
    }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
    user: one(user, {
        fields: [activityLog.userId],
        references: [user.id],
    }),
}));

export const shareLinkRelations = relations(shareLink, ({ one }) => ({
    creator: one(user, {
        fields: [shareLink.createdBy],
        references: [user.id],
    }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
    user: one(user, {
        fields: [notification.userId],
        references: [user.id],
    }),
}));
