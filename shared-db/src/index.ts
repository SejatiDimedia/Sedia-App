import { neon } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";

// Import all schemas
import * as authSchema from "./schema/auth-schema";
import * as arciveSchema from "./schema/sedia-arcive";
import * as posSchema from "./schema/sedia-pos";
import * as noltpediaSchema from "./schema/noltpedia";

// Combined schema type
const combinedSchema = {
    ...authSchema,
    ...arciveSchema,
    ...posSchema,
    ...noltpediaSchema,
};

// Lazy database instance
let _db: NeonHttpDatabase<typeof combinedSchema> | null = null;

function getDb(): NeonHttpDatabase<typeof combinedSchema> {
    if (!_db) {
        // In Vercel/Production, process.env is already populated
        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
            // Only try to load dotenv in development if needed, but for shared-lib consumed by Astro,
            // Astro handles env vars in both dev and prod.
            // If strictly needed for standalone scripts, we should use dynamic import(), but
            // for now, assuming the consumer application (Astro) loads the env is safer for bundling.
            throw new Error(
                "DATABASE_URL environment variable is not set. " +
                "Make sure it's defined in your .env file or Vercel project settings."
            );
        }
        const sql = neon(databaseUrl);
        _db = drizzle(sql, { schema: combinedSchema });
    }
    return _db;
}



// Export a proxy that accesses the db lazily
export const db = new Proxy({} as NeonHttpDatabase<typeof combinedSchema>, {
    get(_, prop) {
        const realDb = getDb();
        const value = (realDb as any)[prop];
        if (typeof value === 'function') {
            return value.bind(realDb);
        }
        return value;
    }
});

// Re-export schemas for convenience
export * from "./schema/auth-schema";
export * from "./schema/sedia-arcive";
export * from "./schema/sedia-pos";
export * from "./schema/noltpedia";

// Re-export drizzle-orm operators for consistent typing
export { eq, and, or, desc, asc, sql, sql as sqlOp } from "drizzle-orm";
