
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import fs from "fs";

config();

async function main() {
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync("debug_output.txt", msg + "\n");
    };

    log("Inspecting app_permission table...");
    if (!process.env.DATABASE_URL) {
        log("DATABASE_URL not found");
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        log("Connecting to DB...");
        // Get all permissions
        const permissions = await sql`
            SELECT * FROM sedia_auth.app_permission
        `;

        log(`Found ${permissions.length} permission records.`);
        permissions.forEach(p => {
            log("------------------------------------------------");
            log(`User ID: ${p.user_id}`);
            log(`App ID: ${p.app_id}`);
            log(`Upload Enabled: ${p.upload_enabled} (${typeof p.upload_enabled})`);
            log(`Max File Size: ${p.max_file_size}`);
            log(`Storage Limit: ${p.storage_limit}`);
            log("Full Record: " + JSON.stringify(p));
        });

    } catch (e) {
        log("Error executing query: " + e);
        if (e instanceof Error) log(e.stack || "");
    }
}

main();
