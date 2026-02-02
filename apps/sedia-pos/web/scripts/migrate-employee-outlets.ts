import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
    console.log("Adding is_deleted column and employee_outlets table...");

    try {
        // 1. Add is_deleted column to employees if not exists
        await sql`
            ALTER TABLE "sedia_pos"."employees" 
            ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false NOT NULL
        `;
        console.log("✓ Added is_deleted column");
    } catch (e: any) {
        if (e.code === '42701') {
            console.log("is_deleted column already exists");
        } else {
            throw e;
        }
    }

    try {
        // 2. Make outlet_id nullable
        await sql`
            ALTER TABLE "sedia_pos"."employees" 
            ALTER COLUMN "outlet_id" DROP NOT NULL
        `;
        console.log("✓ Made outlet_id nullable");
    } catch (e) {
        console.log("outlet_id already nullable or error:", e);
    }

    try {
        // 3. Create employee_outlets table if not exists
        await sql`
            CREATE TABLE IF NOT EXISTS "sedia_pos"."employee_outlets" (
                "id" text PRIMARY KEY NOT NULL,
                "employee_id" text NOT NULL,
                "outlet_id" text NOT NULL,
                "is_primary" boolean DEFAULT false NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                CONSTRAINT "employee_outlets_employee_id_employees_id_fk" 
                    FOREIGN KEY ("employee_id") REFERENCES "sedia_pos"."employees"("id") ON DELETE cascade,
                CONSTRAINT "employee_outlets_outlet_id_outlets_id_fk" 
                    FOREIGN KEY ("outlet_id") REFERENCES "sedia_pos"."outlets"("id") ON DELETE cascade
            )
        `;
        console.log("✓ Created employee_outlets table");
    } catch (e: any) {
        if (e.code === '42P07') {
            console.log("employee_outlets table already exists");
        } else {
            throw e;
        }
    }

    console.log("\n✅ Migration complete!");
}

migrate().catch(console.error);
