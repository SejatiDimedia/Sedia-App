CREATE TABLE "sedia_arcive"."share_link" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"password" text,
	"expires_at" timestamp,
	"allow_download" text DEFAULT 'true' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "share_link_token_unique" UNIQUE("token")
);
