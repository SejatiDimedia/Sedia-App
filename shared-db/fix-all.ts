
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import fs from "fs";

config();

async function main() {
    const log = (msg: string) => {
        console.log(msg);
        try { fs.appendFileSync("fix_log.txt", msg + "\n"); } catch (e) { }
    };

    log("Starting FIX ALL script...");
    if (!process.env.DATABASE_URL) {
        log("DATABASE_URL not found");
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        log("1. Adding max_file_size column...");
        await sql`
            ALTER TABLE "sedia_auth"."app_permission" 
            ADD COLUMN IF NOT EXISTS "max_file_size" bigint DEFAULT 104857600 NOT NULL;
        `;
        log("Column operation completed.");

        log("2. Updating all users to have uploadEnabled = true...");
        const result = await sql`
            UPDATE "sedia_auth"."app_permission"
            SET "upload_enabled" = true,
                "max_file_size" = 104857600
            RETURNING user_id, upload_enabled;
        `;
        log(`Updated ${result.length} users.`);
        result.forEach(r => log(` - Updated user: ${r.user_id}`));

        log("3. Verifying schema column existence...");
        const cols = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'app_permission' AND table_schema = 'sedia_auth'
        `;
        const colNames = cols.map(c => c.column_name);
        log("Columns: " + JSON.stringify(colNames));

        if (!colNames.includes('max_file_size')) {
            log("CRITICAL: max_file_size STILL MISSING!");
        } else {
            log("SUCCESS: max_file_size verified.");
        }

    } catch (e) {
        log("Error executing fix: " + e);
        if (e instanceof Error) log(e.stack || "");
    }
}

main();
