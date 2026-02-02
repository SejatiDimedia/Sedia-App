CREATE TABLE "sedia_pos"."activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text,
	"user_id" text NOT NULL,
	"user_name" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"description" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."held_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text NOT NULL,
	"cashier_id" text,
	"customer_id" text,
	"customer_name" text,
	"customer_phone" text,
	"items" text NOT NULL,
	"notes" text,
	"total_amount" numeric(15, 2) NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."stock_opname_items" (
	"id" text PRIMARY KEY NOT NULL,
	"opname_id" text NOT NULL,
	"product_id" text NOT NULL,
	"system_stock" integer DEFAULT 0 NOT NULL,
	"actual_stock" integer,
	"difference" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."stock_opnames" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sedia_pos"."activity_logs" ADD CONSTRAINT "activity_logs_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."held_orders" ADD CONSTRAINT "held_orders_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."held_orders" ADD CONSTRAINT "held_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sedia_pos"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."stock_opname_items" ADD CONSTRAINT "stock_opname_items_opname_id_stock_opnames_id_fk" FOREIGN KEY ("opname_id") REFERENCES "sedia_pos"."stock_opnames"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."stock_opname_items" ADD CONSTRAINT "stock_opname_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "sedia_pos"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."stock_opnames" ADD CONSTRAINT "stock_opnames_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;