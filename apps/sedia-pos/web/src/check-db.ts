import { config } from 'dotenv';
config();
import { neon } from '@neondatabase/serverless';

async function main() {
    console.log("Starting diagnostic...");
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("DATABASE_URL not found in environment");
        return;
    }
    const sql = neon(url);

    try {
        const res = await sql('SELECT COUNT(*) FROM sedia_pos.visitor_logs');
        console.log("Visitor logs TOTAL count:", res);

        const today = new Date().toISOString().split('T')[0];
        const resToday = await sql('SELECT COUNT(*) FROM sedia_pos.visitor_logs WHERE visit_date = ', [today]);
        console.log("Visitor logs TODAY count:", resToday);

        const samples = await sql('SELECT * FROM sedia_pos.visitor_logs ORDER BY created_at DESC LIMIT 5');
        console.log("Sample logs:", JSON.stringify(samples, null, 2));
    } catch (e) {
        console.error("Query error:", e);
    }
}

main().catch(console.error);
