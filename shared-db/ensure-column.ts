
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config();

async function main() {
    console.log("Ensuring max_file_size column exists...");

    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL not found");
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        await sql`
            ALTER TABLE "sedia_auth"."app_permission" 
            ADD COLUMN IF NOT EXISTS "max_file_size" bigint DEFAULT 104857600 NOT NULL;
        `;
        console.log("SUCCESS: Column ensured.");
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

main();
