import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    console.log('Running manual migration...');
    try {
        await sql`ALTER TABLE "sedia_pos"."outlets" ADD COLUMN IF NOT EXISTS "qris_image_url" text;`;
        console.log('Added qris_image_url to outlets');

        await sql`ALTER TABLE "sedia_pos"."transactions" ADD COLUMN IF NOT EXISTS "midtrans_id" text;`;
        console.log('Added midtrans_id to transactions');

        await sql`ALTER TABLE "sedia_pos"."transactions" ADD COLUMN IF NOT EXISTS "payment_url" text;`;
        console.log('Added payment_url to transactions');

        // Unique constraint might need check if exists, but pure SQL requires querying constraints.
        // We'll try adding it, fail if exists? Or skip for now, index is optimization/constraint.
        // Let's rely on app logic or Drizzle running properly later. 
        // But let's try safely.
        try {
            await sql`CREATE UNIQUE INDEX IF NOT EXISTS "transactions_midtrans_id_unique" ON "sedia_pos"."transactions" ("midtrans_id");`;
            console.log('Added unique index on midtrans_id');
        } catch (e) {
            console.log('Index creation ignored', e);
        }

        await sql`
            CREATE TABLE IF NOT EXISTS "sedia_pos"."transaction_payments" (
                "id" text PRIMARY KEY NOT NULL,
                "transaction_id" text NOT NULL,
                "payment_method" text NOT NULL,
                "amount" numeric(15, 2) NOT NULL,
                "reference_number" text,
                "created_at" timestamp DEFAULT now() NOT NULL,
                FOREIGN KEY ("transaction_id") REFERENCES "sedia_pos"."transactions"("id") ON DELETE no action ON UPDATE no action
            );
        `;
        console.log('Created transaction_payments table');

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

main();
