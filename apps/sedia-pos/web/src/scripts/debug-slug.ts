import { config } from "dotenv";
import path from "path";

// Load .env
const envPath = path.resolve(process.cwd(), ".env");
console.log("Loading .env from:", envPath);
config({ path: envPath, override: true });

console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);

// Use dynamic imports to ensure env is loaded first
async function main() {
    console.log("Loading modules...");
    const { db, posSchema } = await import("../lib/db");
    const { slugify } = await import("../utils/slug");

    console.log("Fetching outlets...");
    try {
        const outlets = await db.select().from(posSchema.outlets);

        console.log(`Found ${outlets.length} outlets.`);

        outlets.forEach(o => {
            const s = slugify(o.name);
            console.log(`Outlet: "${o.name}" -> Slug: "${s}" (ID: ${o.id})`);
        });
    } catch (error) {
        console.error("Error fetching outlets:", error);
    }
}

main();
