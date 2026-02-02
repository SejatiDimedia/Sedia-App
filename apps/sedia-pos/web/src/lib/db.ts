import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Import schemas from local copies (copied from shared-db)
import * as posSchema from "./schema/sedia-pos";
import * as authSchema from "./schema/auth-schema";

const combinedSchema = {
    ...authSchema,
    ...posSchema,
};

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema: combinedSchema });

// Re-export schema for convenience
export { posSchema, authSchema };
