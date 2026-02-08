CREATE TABLE "sedia_pos"."backups" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text NOT NULL,
	"user_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text,
	"file_size" integer,
	"type" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sedia_pos"."backups" ADD CONSTRAINT "backups_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;