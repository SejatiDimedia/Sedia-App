import { pgSchema, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// NOLTPEDIA SCHEMA
// ============================================

export const noltpedia = pgSchema("noltpedia_v1");

// 1. TOPICS (e.g., "PHP", "JavaScript", "Database")
export const topics = noltpedia.table("topics", {
    id: text("id").primaryKey(), // slug-based ID e.g. "php", "javascript"
    name: text("name").notNull(),
    description: text("description"),
    icon: text("icon"), // Icon name or URL
    sortOrder: integer("sort_order").default(0),
    isPublished: boolean("is_published").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// 2. ARTICLES (The core content)
export const articles = noltpedia.table("articles", {
    id: text("id").primaryKey(), // nanoID or UUID
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    content: text("content"), // Markdown/MDX
    topicId: text("topic_id").references(() => topics.id),
    difficulty: text("difficulty").default("beginner"), // beginner, intermediate, advanced
    // 80/20 Rule validation could be metadata or enforced in app
    isPublished: boolean("is_published").default(false),
    viewCount: integer("view_count").default(0),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// 3. GLOSSARY (Dictionary terms)
export const glossary = noltpedia.table("glossary", {
    id: text("id").primaryKey(),
    term: text("term").notNull(),
    definition: text("definition").notNull(),
    relatedArticleId: text("related_article_id").references(() => articles.id),
    createdAt: timestamp("created_at").defaultNow(),
});

// 4. PATHS (Curriculum / Learning Tracks)
export const paths = noltpedia.table("paths", {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    slug: text("slug").notNull().unique(),
    isPublished: boolean("is_published").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

// Join table for Paths <-> Articles (Ordered)
export const pathSteps = noltpedia.table("path_steps", {
    id: text("id").primaryKey(),
    pathId: text("path_id").notNull().references(() => paths.id, { onDelete: 'cascade' }),
    articleId: text("article_id").notNull().references(() => articles.id),
    stepOrder: integer("step_order").notNull(),
});

// 5. COMMENTS (Discussion System)
export const comments = noltpedia.table("comments", {
    id: text("id").primaryKey(), // nanoID
    content: text("content").notNull(),
    articleId: text("article_id").notNull().references(() => articles.id),
    userId: text("user_id").notNull(), // Manually linked to sedia_auth.user
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});


// RELATIONS
// RELATIONS
export const topicRelations = relations(topics, ({ many }) => ({
    articles: many(articles),
}));

export const articleRelations = relations(articles, ({ one, many }) => ({
    topic: one(topics, {
        fields: [articles.topicId],
        references: [topics.id],
    }),
    pathSteps: many(pathSteps),
    comments: many(comments),
}));

export const commentRelations = relations(comments, ({ one }) => ({
    article: one(articles, {
        fields: [comments.articleId],
        references: [articles.id],
    }),
}));



export const pathRelations = relations(paths, ({ many }) => ({
    steps: many(pathSteps),
}));

export const pathStepRelations = relations(pathSteps, ({ one }) => ({
    path: one(paths, {
        fields: [pathSteps.pathId],
        references: [paths.id],
    }),
    article: one(articles, {
        fields: [pathSteps.articleId],
        references: [articles.id],
    }),
}));
