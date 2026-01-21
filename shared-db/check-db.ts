import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
// Load env
import * as dotenv from "dotenv";
dotenv.config();

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function checkDatabase() {
    console.log("Checking database state...");

    try {
        // List all schemas
        const schemas: any = await db.execute(sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('sedia_auth', 'sedia_arcive', 'public');
    `);

        // Handle result structure (could be array or object with rows)
        const schemaRows = Array.isArray(schemas) ? schemas : schemas.rows || [];
        console.log("\nFound Schemas:", schemaRows.map((r: any) => r.schema_name));

        // List all tables in our schemas
        const tables: any = await db.execute(sql`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('sedia_auth', 'sedia_arcive')
      ORDER BY table_schema, table_name;
    `);

        const tableRows = Array.isArray(tables) ? tables : tables.rows || [];

        console.log("\nFound Tables:");
        if (tableRows.length === 0) {
            console.log("No tables found in sedia_auth or sedia_arcive schemas.");
        } else {
            tableRows.forEach((row: any) => {
                console.log(`- ${row.table_schema}.${row.table_name}`);
            });
        }
    } catch (error) {
        console.error("Error executing query:", error);
    }
}

checkDatabase();
