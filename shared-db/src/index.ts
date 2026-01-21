import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import { resolve, dirname } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

// ESM dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import all schemas
import * as authSchema from "./schema/auth-schema";
import * as arciveSchema from "./schema/sedia-arcive";

// Combined schema type
const combinedSchema = {
    ...authSchema,
    ...arciveSchema,
};

// Lazy database instance
let _db: NeonHttpDatabase<typeof combinedSchema> | null = null;
let _envLoaded = false;

function loadEnv() {
    if (_envLoaded) return;
    _envLoaded = true;

    // Try to load .env from various locations  
    const possiblePaths = [
        resolve(process.cwd(), ".env"),                    // App's .env
        resolve(process.cwd(), "../../shared-db/.env"),    // From app to shared-db
        resolve(__dirname, "../.env"),                     // Relative to dist
        resolve(__dirname, "../../.env"),                  // One level up
    ];

    for (const envPath of possiblePaths) {
        if (existsSync(envPath)) {
            config({ path: envPath });
            if (process.env.DATABASE_URL) {
                break;
            }
        }
    }

    // Fallback: Check if Astro loaded it (but not into process.env, which requires dotenv or manual copy)
    if (!process.env.DATABASE_URL && (import.meta as any).env?.DATABASE_URL) {
        process.env.DATABASE_URL = (import.meta as any).env.DATABASE_URL;
    }
}

function getDb(): NeonHttpDatabase<typeof combinedSchema> {
    if (!_db) {
        loadEnv();
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error(
                "DATABASE_URL environment variable is not set. " +
                "Make sure it's defined in your .env file."
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

// Re-export drizzle-orm operators for consistent typing
export { eq, and, or, desc, asc, sql, sql as sqlOp } from "drizzle-orm";
