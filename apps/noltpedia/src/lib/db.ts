import * as shared from "@shared-db";

// Ensure DATABASE_URL is available for the shared-db lazy loader
if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DATABASE_URL && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = import.meta.env.DATABASE_URL;
}

export const db = shared.db;
export const schema = shared;
export * from "@shared-db";
export default db;
