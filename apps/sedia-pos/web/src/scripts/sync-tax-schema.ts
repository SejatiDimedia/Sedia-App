import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config();

async function syncTaxSchema() {
    const sql = neon(process.env.DATABASE_URL!);

    console.log("Syncing tax settings schema...\n");

    try {
        // Create tax_settings table
        await sql`
            CREATE TABLE IF NOT EXISTS sedia_pos.tax_settings (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                outlet_id TEXT NOT NULL UNIQUE REFERENCES sedia_pos.outlets(id),
                name TEXT NOT NULL DEFAULT 'PPN',
                rate NUMERIC(5,2) NOT NULL DEFAULT 0,
                type TEXT NOT NULL DEFAULT 'percentage',
                is_enabled BOOLEAN NOT NULL DEFAULT false,
                is_inclusive BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `;
        console.log("✓ Created tax_settings table");

        console.log("\n✅ Tax schema sync complete!");
    } catch (error: any) {
        console.error("Sync failed:", error.message);
        process.exit(1);
    }
}

syncTaxSchema();
