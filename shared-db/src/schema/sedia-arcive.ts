import { pgSchema, text, timestamp, bigint } from "drizzle-orm/pg-core";
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
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// Activity Log
// ============================================

export const activityLog = sediaArcive.table("activity_log", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    action: text("action").notNull(), // 'upload', 'delete', 'create_folder', 'delete_folder', 'move'
    targetType: text("target_type").notNull(), // 'file' or 'folder'
    targetId: text("target_id").notNull(),
    targetName: text("target_name").notNull(),
    metadata: text("metadata"), // JSON string for additional data (size, mimeType, etc.)
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// Share Links
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
}));

export const fileRelations = relations(file, ({ one }) => ({
    folder: one(folder, {
        fields: [file.folderId],
        references: [folder.id],
    }),
    owner: one(user, {
        fields: [file.userId],
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
