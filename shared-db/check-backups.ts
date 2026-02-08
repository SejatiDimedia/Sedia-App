import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    console.log("Fetching recent backup records...");
    try {
        const result = await sql`
            SELECT id, file_name, file_url, status, created_at 
            FROM "sedia_pos"."backups" 
            ORDER BY created_at DESC 
            LIMIT 5;
        `;
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    } catch (error) {
        console.error("Error fetching backups:", error);
    }
}

main();
