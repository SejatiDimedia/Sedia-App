
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: "/Users/timurdianradhasejati/Programming/Code/Web/ReactAstro/portofolio-hub/apps/sedia-arcive/.env" }); // Absolute path

const runMigration = async () => {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not defined");
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    console.log("Running migration: Add is_starred column...");

    try {
        // Add to folder table
        await sql`ALTER TABLE "sedia_arcive"."folder" ADD COLUMN IF NOT EXISTS "is_starred" boolean DEFAULT false NOT NULL`;
        console.log("Added is_starred to folder");

        // Add to file table
        await sql`ALTER TABLE "sedia_arcive"."file" ADD COLUMN IF NOT EXISTS "is_starred" boolean DEFAULT false NOT NULL`;
        console.log("Added is_starred to file");

        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
    }
};

runMigration();
