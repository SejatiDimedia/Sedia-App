CREATE TABLE "sedia_arcive"."file_access" (
	"id" text PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"shared_with_user_id" text NOT NULL,
	"permission" text DEFAULT 'view' NOT NULL,
	"shared_by" text NOT NULL,
	"shared_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sedia_arcive"."file" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sedia_arcive"."file" ADD COLUMN "deleted_at" timestamp;