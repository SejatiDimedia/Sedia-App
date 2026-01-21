import { pgSchema, text, timestamp, bigint } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth-schema";

// ============================================
// SEDIA ARCIVE - App-Specific Schema
// ============================================
// This schema contains tables specific to SediaArcive app.
// User references come from the centralized sedia_auth schema.
// ============================================

export const sediaArcive = pgSchema("sedia_arcive");

// ============================================
// Core Business Tables
// ============================================

/**
 * Folder table - hierarchical folder structure
 */
export const folder = sediaArcive.table("folder", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    parentId: text("parent_id"), // null = root folder
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }), // Reference to sedia_auth.user
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * File table - file metadata stored in R2
 */
export const file = sediaArcive.table("file", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: bigint("size", { mode: "number" }).notNull(), // bytes
    r2Key: text("r2_key").notNull(), // Cloudflare R2 object key
    folderId: text("folder_id").references(() => folder.id, { onDelete: "set null" }),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }), // Reference to sedia_auth.user
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// Relations
// ============================================

export const folderRelations = relations(folder, ({ one, many }) => ({
    user: one(user, {
        fields: [folder.userId],
        references: [user.id],
    }),
    parent: one(folder, {
        fields: [folder.parentId],
        references: [folder.id],
        relationName: "parentChild",
    }),
    children: many(folder, { relationName: "parentChild" }),
    files: many(file),
}));

export const fileRelations = relations(file, ({ one }) => ({
    user: one(user, {
        fields: [file.userId],
        references: [user.id],
    }),
    folder: one(folder, {
        fields: [file.folderId],
        references: [folder.id],
    }),
}));

// Re-export auth schema for convenience
export { user } from "./auth-schema";
