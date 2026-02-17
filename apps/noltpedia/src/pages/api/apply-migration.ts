import type { APIRoute } from "astro";
import { db, sqlOp } from "../../lib/db";

const migrationSql = `CREATE SCHEMA IF NOT EXISTS "noltpedia_v1";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "noltpedia_v1"."articles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text,
	"topic_id" text,
	"difficulty" text DEFAULT 'beginner',
	"is_published" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"meta_title" text,
	"meta_description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "noltpedia_v1"."comments" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"article_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "noltpedia_v1"."glossary" (
	"id" text PRIMARY KEY NOT NULL,
	"term" text NOT NULL,
	"definition" text NOT NULL,
	"related_article_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "noltpedia_v1"."path_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"path_id" text NOT NULL,
	"article_id" text NOT NULL,
	"step_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "noltpedia_v1"."paths" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "paths_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "noltpedia_v1"."topics" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"sort_order" integer DEFAULT 0,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "noltpedia_v1"."articles" ADD CONSTRAINT "articles_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "noltpedia_v1"."topics"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "noltpedia_v1"."comments" ADD CONSTRAINT "comments_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "noltpedia_v1"."articles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "noltpedia_v1"."glossary" ADD CONSTRAINT "glossary_related_article_id_articles_id_fk" FOREIGN KEY ("related_article_id") REFERENCES "noltpedia_v1"."articles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "noltpedia_v1"."path_steps" ADD CONSTRAINT "path_steps_path_id_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "noltpedia_v1"."paths"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "noltpedia_v1"."path_steps" ADD CONSTRAINT "path_steps_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "noltpedia_v1"."articles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
`;

export const GET: APIRoute = async () => {
    try {
        const statements = migrationSql.split("--> statement-breakpoint");
        const results = [];

        for (const statement of statements) {
            const cleanSql = statement.trim();
            if (cleanSql) {
                // Using sqlOp.raw because cleanSql is a string
                // Note: If sqlOp is not 'sql' from drizzle-orm, we might need a different approach.
                // But in previous steps i imported 'sqlOp' as 'sql' re-export. Let's verify 'db.ts'.
                // If sqlOp is { ... } it might not have raw.
                // Wait. 'sqlOp' was exported as 'sql' in db.ts? No, I exported 'sqlOp' which was 'sql' in shared-db.
                // shared-db references 'sql' from drizzle-orm.
                // dizzle-orm 'sql' usage: sql`...` or sql.raw(`...`).
                await db.execute(sqlOp.raw(cleanSql));
                results.push({ status: "success", sql: cleanSql.substring(0, 50) + "..." });
            }
        }

        return new Response(JSON.stringify({ results }, null, 2), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
