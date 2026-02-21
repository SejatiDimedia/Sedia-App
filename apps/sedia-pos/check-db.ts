import { config } from 'dotenv';
config({ path: 'web/.env' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

async function main() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("DATABASE_URL not found");
        process.exit(1);
    }
    const sql = neon(url);
    const db = drizzle(sql);

    // Raw query to check tables
    const res = await sql('SELECT COUNT(*) FROM sedia_pos.visitor_logs');
    console.log("Visitor logs TOTAL count:", res);

    const today = new Date().toISOString().split('T')[0];
    const resToday = await sql('SELECT COUNT(*) FROM sedia_pos.visitor_logs WHERE visit_date = ', [today]);
    console.log("Visitor logs TODAY count:", resToday);

    const samples = await sql('SELECT * FROM sedia_pos.visitor_logs ORDER BY created_at DESC LIMIT 5');
    console.log("Sample logs:", samples);
}

main().catch(console.error);
