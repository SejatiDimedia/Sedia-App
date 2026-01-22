CREATE TABLE "sedia_auth"."app_permission" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"app_id" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"upload_enabled" boolean DEFAULT false NOT NULL,
	"storage_limit" bigint DEFAULT 524288000 NOT NULL,
	"storage_used" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_permission_user_id_app_id_unique" UNIQUE("user_id","app_id")
);
--> statement-breakpoint
ALTER TABLE "sedia_auth"."app_permission" ADD CONSTRAINT "app_permission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "sedia_auth"."user"("id") ON DELETE cascade ON UPDATE no action;