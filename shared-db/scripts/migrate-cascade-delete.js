import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config();

const sql = neon(process.env.DATABASE_URL);

async function main() {
    console.log("Starting migration for cascade delete on path_steps.article_id...");

    try {
        // Drop existing constraint
        console.log("Dropping existing constraint...");
        try {
            await sql(`ALTER TABLE "noltpedia_v1"."path_steps" DROP CONSTRAINT IF EXISTS "path_steps_article_id_articles_id_fk";`);
            console.log("Existing constraint dropped.");
        } catch (e) {
            if (e.message.includes("does not exist")) {
                console.log("Constraint does not exist, skipping drop.");
            } else {
                throw e;
            }
        }

        // Add new constraint with cascade delete
        console.log("Adding new constraint with cascade delete...");
        await sql(`
            ALTER TABLE "noltpedia_v1"."path_steps"
            ADD CONSTRAINT "path_steps_article_id_articles_id_fk"
            FOREIGN KEY ("article_id") REFERENCES "noltpedia_v1"."articles"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `);
        console.log("New constraint added successfully.");

        console.log("\n✅ Migration complete!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

main();
