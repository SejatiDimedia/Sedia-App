import "dotenv/config";
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function applyLoyaltyMigration() {
    console.log("Applying loyalty tables migration...");

    try {
        // Create loyalty_settings table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "sedia_pos"."loyalty_settings" (
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
        `);
        console.log("✓ Created loyalty_settings table");

        // Create member_tiers table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "sedia_pos"."member_tiers" (
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
        `);
        console.log("✓ Created member_tiers table");

        // Create point_transactions table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "sedia_pos"."point_transactions" (
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
        `);
        console.log("✓ Created point_transactions table");

        // Add columns to customers table (ignore if exists)
        try {
            await db.execute(sql`ALTER TABLE "sedia_pos"."customers" ADD COLUMN "tier_id" text;`);
            console.log("✓ Added tier_id column to customers");
        } catch (e: any) {
            if (e.message?.includes("already exists")) {
                console.log("- tier_id column already exists");
            } else {
                throw e;
            }
        }

        try {
            await db.execute(sql`ALTER TABLE "sedia_pos"."customers" ADD COLUMN "member_since" timestamp DEFAULT now();`);
            console.log("✓ Added member_since column to customers");
        } catch (e: any) {
            if (e.message?.includes("already exists")) {
                console.log("- member_since column already exists");
            } else {
                throw e;
            }
        }

        // Add foreign keys
        try {
            await db.execute(sql`ALTER TABLE "sedia_pos"."loyalty_settings" ADD CONSTRAINT "loyalty_settings_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;`);
            console.log("✓ Added FK for loyalty_settings");
        } catch (e) { console.log("- FK loyalty_settings already exists"); }

        try {
            await db.execute(sql`ALTER TABLE "sedia_pos"."member_tiers" ADD CONSTRAINT "member_tiers_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;`);
            console.log("✓ Added FK for member_tiers");
        } catch (e) { console.log("- FK member_tiers already exists"); }

        try {
            await db.execute(sql`ALTER TABLE "sedia_pos"."point_transactions" ADD CONSTRAINT "point_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sedia_pos"."customers"("id") ON DELETE no action ON UPDATE no action;`);
            console.log("✓ Added FK for point_transactions customer");
        } catch (e) { console.log("- FK point_transactions customer already exists"); }

        try {
            await db.execute(sql`ALTER TABLE "sedia_pos"."point_transactions" ADD CONSTRAINT "point_transactions_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE no action ON UPDATE no action;`);
            console.log("✓ Added FK for point_transactions outlet");
        } catch (e) { console.log("- FK point_transactions outlet already exists"); }

        try {
            await db.execute(sql`ALTER TABLE "sedia_pos"."customers" ADD CONSTRAINT "customers_tier_id_member_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "sedia_pos"."member_tiers"("id") ON DELETE no action ON UPDATE no action;`);
            console.log("✓ Added FK for customers tier_id");
        } catch (e) { console.log("- FK customers tier_id already exists"); }

        console.log("\n✅ Migration complete!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

applyLoyaltyMigration();
