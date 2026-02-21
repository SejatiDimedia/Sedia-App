const { neon } = require('@neondatabase/serverless');
const url = "postgresql://neondb_owner:npg_OX3u7gtFsIvN@ep-raspy-night-a8l71l7a-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";
const sql = neon(url);

async function check() {
    console.log("Checking DB...");
    try {
        const tables = await sql("SELECT table_name FROM information_schema.tables WHERE table_schema = 'sedia_pos'");
        console.log("Tables in sedia_pos:", tables.map(t => t.table_name));

        const countLogs = await sql("SELECT COUNT(*) FROM sedia_pos.visitor_logs");
        console.log("Total visitor logs:", countLogs);

        const countEvents = await sql("SELECT COUNT(*) FROM sedia_pos.catalog_events");
        console.log("Total catalog events:", countEvents);

        const recent = await sql("SELECT outlet_id, visitor_id, visit_date, created_at FROM sedia_pos.visitor_logs ORDER BY created_at DESC LIMIT 3");
        console.log("Recent logs:", JSON.stringify(recent, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

check();
