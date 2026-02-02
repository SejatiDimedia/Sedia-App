import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config();

const sql = neon(process.env.DATABASE_URL);

async function main() {
    console.log("Starting manual migration for held_orders...");

    try {
        console.log("Creating table sedia_pos.held_orders...");
        await sql(`
            CREATE TABLE IF NOT EXISTS "sedia_pos"."held_orders" (
                "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
                "outlet_id" text NOT NULL REFERENCES "sedia_pos"."outlets"("id"),
                "cashier_id" text,
                "customer_id" text REFERENCES "sedia_pos"."customers"("id"),
                "customer_name" text,
                "customer_phone" text,
                "items" text NOT NULL,
                "notes" text,
                "total_amount" numeric(15, 2) NOT NULL,
                "status" text DEFAULT 'active' NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        console.log("Table created successfully.");

        console.log("Migration complete!");
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

main();
