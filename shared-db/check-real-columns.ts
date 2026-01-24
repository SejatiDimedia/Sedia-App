
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config();

async function main() {
    console.log("Checking ACTUAL database columns by selecting a row...");

    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL not found");
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        // Method 1: Information Schema
        const columns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'sedia_auth' 
            AND table_name = 'app_permission';
        `;
        console.log("Information Schema Columns:", columns.map(c => c.column_name));

        // Method 2: Select * (Runtime check)
        const rows = await sql`SELECT * FROM "sedia_auth"."app_permission" LIMIT 1`;
        if (rows.length > 0) {
            console.log("Runtime Row Keys:", Object.keys(rows[0]));
        } else {
            console.log("Table is empty, cannot check runtime keys.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
