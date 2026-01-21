import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import fs from "fs";

async function run() {
    console.log("Starting migration...");

    if (!fs.existsSync("drizzle")) {
        console.error("Error: 'drizzle' folder not found in current directory.");
        process.exit(1);
    }

    try {
        const sql = neon(process.env.DATABASE_URL!);
        const db = drizzle(sql);

        console.log("Running migrate()...");
        await migrate(db, { migrationsFolder: "drizzle" });
        console.log("Migration executed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

run();
