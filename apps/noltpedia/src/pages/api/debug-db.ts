import type { APIRoute } from "astro";
import { db, sqlOp } from "../../lib/db";

export const GET: APIRoute = async () => {
    try {
        // List all schemas
        const schemas = await db.execute(sqlOp`SELECT schema_name FROM information_schema.schemata`);

        // List all tables in noltpedia_v1
        const tables = await db.execute(sqlOp`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'noltpedia_v1'
        `);

        // List all tables in public
        const publicTables = await db.execute(sqlOp`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        return new Response(JSON.stringify({
            schemas: schemas.rows,
            noltpedia_tables: tables.rows,
            public_tables: publicTables.rows
        }, null, 2), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
