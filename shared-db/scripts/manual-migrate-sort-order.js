import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config();

const sql = neon(process.env.DATABASE_URL);

async function main() {
    console.log("Starting manual migration for sort_order column...");

    try {
        console.log("Adding sort_order column to articles table...");
        try {
            await sql(`ALTER TABLE "noltpedia_v1"."articles" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0;`);
            console.log("sort_order column added successfully.");
        } catch (e) {
            if (e.message.includes("already exists")) {
                console.log("Column sort_order already exists, skipping.");
            } else {
                console.error("Error adding column:", e.message);
                throw e;
            }
        }

        console.log("Migration complete!");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

main();
