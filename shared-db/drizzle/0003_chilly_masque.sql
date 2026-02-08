CREATE TABLE "sedia_pos"."activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text,
	"user_id" text NOT NULL,
	"user_name" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"description" text NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
