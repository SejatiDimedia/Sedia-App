import 'dotenv/config';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import * as posSchema from "../lib/schema/sedia-pos";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: posSchema });

async function debugOutletsAndProducts() {
    console.log("\n=== DEBUG: Outlets ===");
    const outlets = await db.select().from(posSchema.outlets);

    for (const outlet of outlets) {
        const slug = outlet.name
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');

        console.log(`\nOutlet: "${outlet.name}"`);
        console.log(`  ID: ${outlet.id}`);
        console.log(`  Generated Slug: "${slug}"`);

        // Count products for this outlet
        const products = await db
            .select()
            .from(posSchema.products)
            .where(eq(posSchema.products.outletId, outlet.id));

        console.log(`  Total Products: ${products.length}`);

        const activeProducts = products.filter(p => p.isActive && !p.isDeleted);
        console.log(`  Active (not deleted) Products: ${activeProducts.length}`);

        if (products.length > 0) {
            console.log("  Products:");
            products.forEach(p => {
                console.log(`    - ${p.name} (isActive: ${p.isActive}, isDeleted: ${p.isDeleted})`);
            });
        }
    }
}

debugOutletsAndProducts().catch(console.error);
