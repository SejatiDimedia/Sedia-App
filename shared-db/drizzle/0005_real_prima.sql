CREATE TABLE "sedia_arcive"."folder_access" (
	"id" text PRIMARY KEY NOT NULL,
	"folder_id" text NOT NULL,
	"shared_with_user_id" text NOT NULL,
	"permission" text DEFAULT 'view' NOT NULL,
	"shared_by" text NOT NULL,
	"shared_at" timestamp DEFAULT now() NOT NULL
);
