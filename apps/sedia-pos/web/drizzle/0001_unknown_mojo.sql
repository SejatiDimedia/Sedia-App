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
ALTER TABLE "sedia_pos"."product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "sedia_pos"."products"("id") ON DELETE cascade ON UPDATE no action;