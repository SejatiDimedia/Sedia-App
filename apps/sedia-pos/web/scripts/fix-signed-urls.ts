import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

/**
 * This script cleans up expired signed URLs in the database.
 * It extracts the clean R2 key from signed URLs and Cloudflare storage URLs,
 * then updates the database records.
 */
async function cleanupSignedUrls() {
    const sql = neon(process.env.DATABASE_URL!);

    console.log("=== Cleaning Up Signed/Expired URLs in Database ===\n");

    // 1. Find all products with cloudflarestorage.com URLs (signed URLs stored by mistake)
    const productsWithSignedUrls = await sql`
        SELECT id, name, image_url 
        FROM sedia_pos.products 
        WHERE image_url LIKE '%cloudflarestorage.com%' 
        AND is_deleted = false
    `;

    console.log(`Found ${productsWithSignedUrls.length} products with signed/storage URLs:\n`);

    let fixedCount = 0;

    for (const product of productsWithSignedUrls) {
        const oldUrl = product.image_url as string;

        // Extract clean key from the signed URL
        // URL format: https://bucket.accountid.r2.cloudflarestorage.com/key?X-Amz-...
        let cleanKey: string | null = null;

        try {
            const url = new URL(oldUrl);
            // pathname starts with /, so remove the leading slash
            cleanKey = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
        } catch (e) {
            console.error(`  ❌ Could not parse URL for "${product.name}": ${oldUrl}`);
            continue;
        }

        if (!cleanKey) {
            console.error(`  ❌ Could not extract key for "${product.name}"`);
            continue;
        }

        console.log(`  🔧 "${product.name}"`);
        console.log(`     OLD: ${oldUrl.substring(0, 100)}...`);
        console.log(`     NEW: ${cleanKey}`);

        // Update the database
        await sql`
            UPDATE sedia_pos.products 
            SET image_url = ${cleanKey}
            WHERE id = ${product.id}
        `;

        fixedCount++;
        console.log(`     ✅ Fixed!\n`);
    }

    // 2. Also check outlet logos
    const outletsWithSignedUrls = await sql`
        SELECT id, name, logo_url 
        FROM sedia_pos.outlets 
        WHERE logo_url LIKE '%cloudflarestorage.com%'
    `;

    if (outletsWithSignedUrls.length > 0) {
        console.log(`\nFound ${outletsWithSignedUrls.length} outlets with signed URLs:\n`);

        for (const outlet of outletsWithSignedUrls) {
            const oldUrl = outlet.logo_url as string;
            let cleanKey: string | null = null;

            try {
                const url = new URL(oldUrl);
                cleanKey = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
            } catch (e) {
                console.error(`  ❌ Could not parse URL for outlet "${outlet.name}": ${oldUrl}`);
                continue;
            }

            if (!cleanKey) continue;

            console.log(`  🔧 Outlet "${outlet.name}"`);
            console.log(`     OLD: ${oldUrl.substring(0, 100)}...`);
            console.log(`     NEW: ${cleanKey}`);

            await sql`
                UPDATE sedia_pos.outlets 
                SET logo_url = ${cleanKey}
                WHERE id = ${outlet.id}
            `;

            fixedCount++;
            console.log(`     ✅ Fixed!\n`);
        }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total records fixed: ${fixedCount}`);
    console.log(`Done! All signed URLs have been replaced with clean R2 keys.`);
}

cleanupSignedUrls().catch(console.error);
