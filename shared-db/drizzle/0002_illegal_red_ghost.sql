CREATE TABLE "sedia_arcive"."activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"target_name" text NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sedia_arcive"."file" DROP CONSTRAINT "file_folder_id_folder_id_fk";
--> statement-breakpoint
ALTER TABLE "sedia_arcive"."file" DROP CONSTRAINT "file_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "sedia_arcive"."folder" DROP CONSTRAINT "folder_user_id_user_id_fk";
