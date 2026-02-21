CREATE TABLE "sedia_pos"."purchase_order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"purchase_order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"quantity" integer NOT NULL,
	"cost_price" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."purchase_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text NOT NULL,
	"supplier_id" text NOT NULL,
	"invoice_number" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"order_date" timestamp DEFAULT now(),
	"expected_date" timestamp,
	"received_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text NOT NULL,
	"name" text NOT NULL,
	"contact_person" text,
	"email" text,
	"phone" text,
	"address" text,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."tax_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text NOT NULL,
	"name" text DEFAULT 'PPN' NOT NULL,
	"rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"type" text DEFAULT 'percentage' NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"is_inclusive" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tax_settings_outlet_id_unique" UNIQUE("outlet_id")
);
--> statement-breakpoint
ALTER TABLE "sedia_auth"."app_permission" ADD COLUMN "max_file_size" bigint DEFAULT 104857600 NOT NULL;--> statement-breakpoint
ALTER TABLE "sedia_auth"."user" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "sedia_auth"."user" ADD COLUMN "banned" boolean;--> statement-breakpoint
ALTER TABLE "sedia_auth"."user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "sedia_auth"."user" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "sedia_pos"."inventory_logs" ADD COLUMN "variant_id" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."outlets" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."outlets" ADD COLUMN "primary_color" text DEFAULT '#2e6a69';--> statement-breakpoint
ALTER TABLE "sedia_pos"."outlets" ADD COLUMN "secondary_color" text DEFAULT '#f2b30c';--> statement-breakpoint
ALTER TABLE "sedia_pos"."outlets" ADD COLUMN "open_time" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."outlets" ADD COLUMN "close_time" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."outlets" ADD COLUMN "greeting" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."outlets" ADD COLUMN "is_catalog_visible" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "sedia_pos"."payment_methods" ADD COLUMN "is_manual" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "sedia_pos"."payment_methods" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."payment_methods" ADD COLUMN "account_number" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."payment_methods" ADD COLUMN "account_holder" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."payment_methods" ADD COLUMN "bank_accounts" jsonb;--> statement-breakpoint
ALTER TABLE "sedia_pos"."payment_methods" ADD COLUMN "qris_data" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."payment_methods" ADD COLUMN "qris_image_url" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."products" ADD COLUMN "is_featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "sedia_pos"."products" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sedia_pos"."stock_opname_items" ADD COLUMN "variant_id" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."transaction_items" ADD COLUMN "variant_id" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."transaction_items" ADD COLUMN "variant_name" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."transactions" ADD COLUMN "customer_name" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "sedia_pos"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "sedia_pos"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "sedia_pos"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."purchase_orders" ADD CONSTRAINT "purchase_orders_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "sedia_pos"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."suppliers" ADD CONSTRAINT "suppliers_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."tax_settings" ADD CONSTRAINT "tax_settings_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."inventory_logs" ADD CONSTRAINT "inventory_logs_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "sedia_pos"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."stock_opname_items" ADD CONSTRAINT "stock_opname_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "sedia_pos"."product_variants"("id") ON DELETE no action ON UPDATE no action;