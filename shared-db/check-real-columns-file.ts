
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import fs from "fs";

config();

async function main() {
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync("real_cols_result.txt", msg + "\n");
    };

    log("Checking ACTUAL database columns...");

    if (!process.env.DATABASE_URL) {
        log("DATABASE_URL not found");
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        const columns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'sedia_auth' 
            AND table_name = 'app_permission';
        `;
        log("Information Schema Columns: " + JSON.stringify(columns.map(c => c.column_name)));

    } catch (e) {
        log("Error: " + e);
    }
}

main();
