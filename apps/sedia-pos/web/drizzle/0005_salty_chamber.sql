CREATE TABLE "sedia_pos"."transaction_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"payment_method" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"reference_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sedia_pos"."outlets" ADD COLUMN "qris_image_url" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."transactions" ADD COLUMN "midtrans_id" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."transactions" ADD COLUMN "payment_url" text;--> statement-breakpoint
ALTER TABLE "sedia_pos"."transaction_payments" ADD CONSTRAINT "transaction_payments_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "sedia_pos"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sedia_pos"."transactions" ADD CONSTRAINT "transactions_midtrans_id_unique" UNIQUE("midtrans_id");