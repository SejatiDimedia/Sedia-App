
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import fs from "fs";

config();

async function main() {
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync("migration_log.txt", msg + "\n");
    };

    log("Starting manual migration...");
    if (!process.env.DATABASE_URL) {
        log("DATABASE_URL not found");
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        log("Attempting to add max_file_size column...");
        await sql`
            ALTER TABLE "sedia_auth"."app_permission" 
            ADD COLUMN IF NOT EXISTS "max_file_size" bigint DEFAULT 104857600 NOT NULL;
        `;
        log("SUCCESS: Column added or already exists.");

        // Update user permissions to true just in case? 
        // No, let's just fix the schema first.

    } catch (e) {
        log("Error executing migration: " + e);
        if (e instanceof Error) log(e.stack || "");
    }
}

main();
