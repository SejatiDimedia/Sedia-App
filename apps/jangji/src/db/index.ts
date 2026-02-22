import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection string from env or fallback for local development
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/jangji_db';

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
