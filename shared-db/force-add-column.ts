
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Load env from the monorepo root or shared-db specific location if needed
// But we'll try standard loading first
config();

async function main() {
    const log = (msg: string) => {
        console.log(msg);
        try { fs.appendFileSync("force_migration.log", msg + "\n"); } catch { }
    };

    log("Starting FORCE MIGRATION script...");

    // Check for DATABASE_URL
    if (!process.env.DATABASE_URL) {
        log("ERROR: DATABASE_URL is not set in environment.");
        // Try to load from ../.env if possible (monorepo root)
        try {
            const rootEnvPath = path.resolve(__dirname, "../../.env");
            log(`Attempting to load env from: ${rootEnvPath}`);
            config({ path: rootEnvPath });
        } catch (e) { }
    }

    if (!process.env.DATABASE_URL) {
        log("CRITICAL ERROR: Could not find DATABASE_URL even after checking root.");
        process.exit(1);
    } else {
        // Mask the URL for safety in logs
        const maskedUrl = process.env.DATABASE_URL.replace(/:[^:]*@/, ":***@");
        log(`Using Database: ${maskedUrl}`);
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        log("1. Checking if column exists...");
        const check = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'sedia_auth' 
            AND table_name = 'app_permission' 
            AND column_name = 'max_file_size';
        `;

        if (check.length > 0) {
            log("Column 'max_file_size' ALREADY EXISTS.");
        } else {
            log("Column 'max_file_size' MISSING. Attempting to ADD...");
            await sql`
                ALTER TABLE "sedia_auth"."app_permission" 
                ADD COLUMN "max_file_size" bigint DEFAULT 104857600 NOT NULL;
            `;
            log("SUCCESS: Column added manually via SQL.");
        }

    } catch (e) {
        log("Error executing migration: " + e);
        if (e instanceof Error) log(e.stack || "");
    }
}

main();
