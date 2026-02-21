import { db } from "./src/lib/db.ts";
import * as posSchema from "./src/lib/schema/sedia-pos.ts";
import { eq, and, ilike } from "drizzle-orm";

async function checkProducts() {
    const outlets = await db.query.outlets.findMany({
        where: ilike(posSchema.outlets.name, "%Eksponen Shop%")
    });

    for (const outlet of outlets) {
        console.log(`\n--- Outlet: ${outlet.name} (${outlet.id}) ---`);
        const products = await db.query.products.findMany({
            where: eq(posSchema.products.outletId, outlet.id),
            with: {
                variants: true
            }
        });

        if (products.length === 0) {
            console.log("  No products found.");
            continue;
        }

        console.log("\n--- All Products in Eksponen Shop ---");
        products.forEach(p => {
            const hasVariants = p.variants && p.variants.length > 0;
            const totalVariantStock = p.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
            const status = p.isActive ? (p.isFeatured ? "FEATURED" : "ACTIVE") : "INACTIVE";
            console.log(`  - [${status}] ${p.name}: MainStock=${p.stock}, TotalVariantStock=${totalVariantStock}, Variants=${p.variants.length}`);
        });
    }
}

checkProducts().catch(console.error);
