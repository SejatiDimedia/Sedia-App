
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Function to log to file since stdout is unreliable
const LOG_FILE = "debug_fix.log";
fs.writeFileSync(LOG_FILE, "Starting fix script...\n");

function log(msg: string) {
    try {
        console.log(msg);
        fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) { }
}

async function main() {
    log("Scanning for .env files...");

    const possiblePaths = [
        path.resolve(process.cwd(), ".env"),
        path.resolve(process.cwd(), "../.env"),
        path.resolve(process.cwd(), "../../.env"),
        path.resolve(process.cwd(), "../apps/sedia-arcive/.env"),
        path.resolve(process.cwd(), "apps/sedia-arcive/.env") // if cwd is root
    ];

    let dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        for (const p of possiblePaths) {
            log(`Checking: ${p}`);
            if (fs.existsSync(p)) {
                log(`Found .env at ${p}`);
                const result = config({ path: p });
                if (result.parsed?.DATABASE_URL) {
                    dbUrl = result.parsed.DATABASE_URL;
                    log("Loaded DATABASE_URL from this file.");
                    break;
                } else {
                    log("File exists but no DATABASE_URL inside.");
                }
            }
        }
    } else {
        log("DATABASE_URL already in process.env");
    }

    if (!dbUrl) {
        log("CRITICAL: No DATABASE_URL found.");
        return;
    }

    log(`Connecting to DB... (Length: ${dbUrl.length})`);

    try {
        const sql = neon(dbUrl);

        // 1. Check existing columns
        log("Checking schema...");
        const columns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'sedia_auth' 
            AND table_name = 'app_permission';
        `;

        const colNames = columns.map((c: any) => c.column_name);
        log(`Current columns: ${colNames.join(", ")}`);

        if (colNames.includes("max_file_size")) {
            log("Column 'max_file_size' ALREADY EXISTS.");
        } else {
            log("Column MISSING. Adding it now...");
            await sql`
                ALTER TABLE "sedia_auth"."app_permission" 
                ADD COLUMN IF NOT EXISTS "max_file_size" bigint DEFAULT 104857600 NOT NULL;
            `;
            log("ALTER TABLE command executed.");
        }

        // 2. Verify again
        const check2 = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'sedia_auth' 
            AND table_name = 'app_permission'
            AND column_name = 'max_file_size';
        `;

        if (check2.length > 0) {
            log("SUCCESS: max_file_size confirmed in schema.");
        } else {
            log("FAILURE: Column still not found after ALTER.");
        }

    } catch (e: any) {
        log(`ERROR executing SQL: ${e.message}`);
        log(e.stack);
    }
}

main().catch(e => log(`Fatal: ${e}`));
