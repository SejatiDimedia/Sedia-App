
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import fs from "fs";

config();

async function main() {
    console.log("Checking columns...");
    if (!process.env.DATABASE_URL) {
        fs.writeFileSync("result.txt", "DATABASE_URL not found");
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        const result = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'app_permission' AND table_schema = 'sedia_auth';
        `;
        const columns = result.map((r) => r.column_name);

        if (columns.includes('max_file_size')) {
            fs.writeFileSync("result.txt", "SUCCESS: max_file_size exists. All columns: " + JSON.stringify(columns));
        } else {
            fs.writeFileSync("result.txt", "FAILURE: max_file_size MISSING. All columns: " + JSON.stringify(columns));
        }
    } catch (e) {
        fs.writeFileSync("result.txt", "Error: " + e.toString());
    }
}

main();
