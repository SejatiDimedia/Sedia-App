const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const url = "postgresql://neondb_owner:npg_OX3u7gtFsIvN@ep-raspy-night-a8l71l7a-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";
const sql = neon(url);

async function check() {
    let output = "DB Diagnostic\n";
    try {
        const countLogs = await sql("SELECT COUNT(*) FROM sedia_pos.visitor_logs");
        output += "Visitor logs count: " + JSON.stringify(countLogs) + "\n";
        
        const countEvents = await sql("SELECT COUNT(*) FROM sedia_pos.catalog_events");
        output += "Catalog events count: " + JSON.stringify(countEvents) + "\n";

        const recent = await sql("SELECT outlet_id, visitor_id, visit_date, created_at FROM sedia_pos.visitor_logs ORDER BY created_at DESC LIMIT 5");
        output += "Recent logs: " + JSON.stringify(recent, null, 2) + "\n";
        
        fs.writeFileSync('db-diag-out.txt', output);
        console.log("Done");
    } catch (e) {
        fs.writeFileSync('db-diag-out.txt', "Error: " + e.message);
    }
}

check();
