import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config();

const sql = neon(process.env.DATABASE_URL);

async function main() {
    console.log("Starting manual migration...");

    try {
        console.log("Applying 0006_next_bromley.sql (Create Notification Table)...");
        await sql(`
            CREATE TABLE IF NOT EXISTS "sedia_arcive"."notification" (
                "id" text PRIMARY KEY NOT NULL,
                "user_id" text NOT NULL,
                "type" text NOT NULL,
                "title" text NOT NULL,
                "message" text NOT NULL,
                "is_read" boolean DEFAULT false NOT NULL,
                "link" text,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        console.log("0006 done.");

        console.log("Applying 0007_dear_puppet_master.sql (Add updatedAt)...");
        // Check if column exists first to avoid error
        try {
            await sql(`ALTER TABLE "sedia_arcive"."notification" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;`);
            console.log("0007 done.");
        } catch (e) {
            if (e.message.includes("already exists")) {
                console.log("Column updated_at already exists, skipping.");
            } else {
                throw e;
            }
        }

        console.log("Migration complete!");
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

main();
