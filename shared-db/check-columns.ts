
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config();

async function main() {
    console.log("Checking columns...");
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL not found");
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        const result = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'app_permission' AND table_schema = 'sedia_auth';
        `;
        const columns = result.map((r: any) => r.column_name);
        console.log("Columns found:", columns);

        if (columns.includes('max_file_size')) {
            console.log("SUCCESS: max_file_size column exists.");
        } else {
            console.log("FAILURE: max_file_size column MISSING.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
