import { pgSchema, text, timestamp, boolean, bigint, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// SEDIA AUTH - Centralized Authentication Schema
// ============================================
// This schema is shared across all Sedia ecosystem apps:
// - SediaArcive
// - (Future apps)
// ============================================

export const sediaAuth = pgSchema("sedia_auth");

// ============================================
// BetterAuth Core Tables
// ============================================

/**
 * User table - stores user profile information
 * Central user table for all Sedia apps
 */
export const user = sediaAuth.table("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: text("role"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Session table - stores active user sessions
 */
export const session = sediaAuth.table("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});

/**
 * Account table - links OAuth providers to users
 */
export const account = sediaAuth.table("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Verification table - stores email/phone verification tokens
 */
export const verification = sediaAuth.table("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * App Permissions table - stores per-app roles and limits
 * Each user can have different permissions for each app
 */
export const appPermission = sediaAuth.table("app_permission", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    appId: text("app_id").notNull(), // e.g., 'sedia-arcive'
    role: text("role").notNull().default("user"), // 'user' | 'admin'
    uploadEnabled: boolean("upload_enabled").notNull().default(false),
    storageLimit: bigint("storage_limit", { mode: "number" }).notNull().default(524288000), // 500 MB
    // maxFileSize: bigint("max_file_size", { mode: "number" }).notNull().default(104857600), // 100 MB
    storageUsed: bigint("storage_used", { mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    // Unique constraint: one permission record per user per app
    userAppUnique: unique().on(table.userId, table.appId),
}));

// ============================================
// Relations
// ============================================

export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    accounts: many(account),
    appPermissions: many(appPermission),
}));

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));

export const appPermissionRelations = relations(appPermission, ({ one }) => ({
    user: one(user, {
        fields: [appPermission.userId],
        references: [user.id],
    }),
}));
