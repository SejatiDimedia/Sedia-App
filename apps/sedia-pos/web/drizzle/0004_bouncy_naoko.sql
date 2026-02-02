CREATE TABLE "sedia_pos"."loyalty_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text NOT NULL,
	"points_per_amount" integer DEFAULT 1,
	"amount_per_point" integer DEFAULT 1000,
	"redemption_rate" integer DEFAULT 100,
	"redemption_value" integer DEFAULT 10000,
	"is_enabled" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_settings_outlet_id_unique" UNIQUE("outlet_id")
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."member_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text NOT NULL,
	"name" text NOT NULL,
	"min_points" integer DEFAULT 0 NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"point_multiplier" numeric(3, 2) DEFAULT '1.00',
	"color" text DEFAULT '#6b7280',
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."point_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"outlet_id" text NOT NULL,
	"transaction_id" text,
	"type" text NOT NULL,
	"points" integer NOT NULL,
	"description" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sedia_pos"."customers" ADD COLUMN "tier_id" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."customers" ADD COLUMN "member_since" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "sedia_pos"."loyalty_settings" ADD CONSTRAINT "loyalty_settings_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."member_tiers" ADD CONSTRAINT "member_tiers_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."point_transactions" ADD CONSTRAINT "point_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sedia_pos"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."point_transactions" ADD CONSTRAINT "point_transactions_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."customers" ADD CONSTRAINT "customers_tier_id_member_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "sedia_pos"."member_tiers"("id") ON DELETE no action ON UPDATE no action;