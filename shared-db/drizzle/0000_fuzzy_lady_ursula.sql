CREATE SCHEMA "sedia_auth";
--> statement-breakpoint
CREATE SCHEMA "sedia_arcive";
--> statement-breakpoint
CREATE SCHEMA "sedia_pos";
--> statement-breakpoint
CREATE TABLE "sedia_auth"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "sedia_auth"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sedia_auth"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "sedia_auth"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "sedia_arcive"."file" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" bigint NOT NULL,
	"r2_key" text NOT NULL,
	"folder_id" text,
	"user_id" text NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_arcive"."file_access" (
	"id" text PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"shared_with_user_id" text NOT NULL,
	"permission" text DEFAULT 'view' NOT NULL,
	"shared_by" text NOT NULL,
	"shared_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_arcive"."folder" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_id" text,
	"user_id" text NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_arcive"."folder_access" (
	"id" text PRIMARY KEY NOT NULL,
	"folder_id" text NOT NULL,
	"shared_with_user_id" text NOT NULL,
	"permission" text DEFAULT 'view' NOT NULL,
	"shared_by" text NOT NULL,
	"shared_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_arcive"."notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"link" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "sedia_pos"."categories" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."customers" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text NOT NULL,
	"tier_id" text,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"points" integer DEFAULT 0,
	"total_spent" numeric(15, 2) DEFAULT '0',
	"member_since" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."employee_outlets" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"outlet_id" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."employees" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text,
	"user_id" text,
	"role_id" text,
	"name" text NOT NULL,
	"role" text DEFAULT 'cashier' NOT NULL,
	"pin_code" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."inventory_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text NOT NULL,
	"product_id" text NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "sedia_pos"."outlets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"qris_image_url" text,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text,
	"name" text NOT NULL,
	"type" text DEFAULT 'cash' NOT NULL,
	"is_active" boolean DEFAULT true,
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
CREATE TABLE "sedia_pos"."product_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'size' NOT NULL,
	"price_adjustment" numeric(15, 2) DEFAULT '0',
	"stock" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."products" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text NOT NULL,
	"category_id" text,
	"name" text NOT NULL,
	"sku" text,
	"barcode" text,
	"price" numeric(15, 2) NOT NULL,
	"cost_price" numeric(15, 2) DEFAULT '0',
	"stock" integer DEFAULT 0 NOT NULL,
	"track_stock" boolean DEFAULT true,
	"image_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."roles" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text,
	"name" text NOT NULL,
	"description" text,
	"permissions" text NOT NULL,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."shifts" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text,
	"employee_id" text,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"starting_cash" numeric(15, 2) NOT NULL,
	"ending_cash" numeric(15, 2),
	"expected_cash" numeric(15, 2),
	"difference" numeric(15, 2),
	"status" text DEFAULT 'open' NOT NULL,
	"notes" text
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
CREATE TABLE "sedia_pos"."transaction_items" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"product_id" text,
	"product_name" text NOT NULL,
	"product_sku" text,
	"quantity" integer NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"cost_price" numeric(15, 2),
	"discount" numeric(15, 2) DEFAULT '0',
	"total" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."transaction_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"payment_method" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"reference_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sedia_pos"."transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"outlet_id" text NOT NULL,
	"invoice_number" text NOT NULL,
	"customer_id" text,
	"cashier_id" text,
	"subtotal" numeric(15, 2) NOT NULL,
	"discount" numeric(15, 2) DEFAULT '0',
	"tax" numeric(15, 2) DEFAULT '0',
	"total_amount" numeric(15, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"payment_status" text DEFAULT 'paid' NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"midtrans_id" text,
	"payment_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_midtrans_id_unique" UNIQUE("midtrans_id")
);
--> statement-breakpoint
ALTER TABLE "sedia_auth"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "sedia_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_auth"."app_permission" ADD CONSTRAINT "app_permission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "sedia_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_auth"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "sedia_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."categories" ADD CONSTRAINT "categories_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."customers" ADD CONSTRAINT "customers_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."customers" ADD CONSTRAINT "customers_tier_id_member_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "sedia_pos"."member_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."employee_outlets" ADD CONSTRAINT "employee_outlets_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "sedia_pos"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."employee_outlets" ADD CONSTRAINT "employee_outlets_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."employees" ADD CONSTRAINT "employees_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."employees" ADD CONSTRAINT "employees_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "sedia_pos"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."inventory_logs" ADD CONSTRAINT "inventory_logs_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."inventory_logs" ADD CONSTRAINT "inventory_logs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "sedia_pos"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."loyalty_settings" ADD CONSTRAINT "loyalty_settings_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."member_tiers" ADD CONSTRAINT "member_tiers_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."payment_methods" ADD CONSTRAINT "payment_methods_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."point_transactions" ADD CONSTRAINT "point_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sedia_pos"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."point_transactions" ADD CONSTRAINT "point_transactions_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "sedia_pos"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."products" ADD CONSTRAINT "products_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "sedia_pos"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."roles" ADD CONSTRAINT "roles_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."shifts" ADD CONSTRAINT "shifts_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."shifts" ADD CONSTRAINT "shifts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "sedia_pos"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."stock_opname_items" ADD CONSTRAINT "stock_opname_items_opname_id_stock_opnames_id_fk" FOREIGN KEY ("opname_id") REFERENCES "sedia_pos"."stock_opnames"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."stock_opname_items" ADD CONSTRAINT "stock_opname_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "sedia_pos"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."stock_opnames" ADD CONSTRAINT "stock_opnames_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "sedia_pos"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."transaction_items" ADD CONSTRAINT "transaction_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "sedia_pos"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."transaction_payments" ADD CONSTRAINT "transaction_payments_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "sedia_pos"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."transactions" ADD CONSTRAINT "transactions_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."transactions" ADD CONSTRAINT "transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sedia_pos"."customers"("id") ON DELETE no action ON UPDATE no action;