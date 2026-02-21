import { db, posSchema } from "./web/src/lib/db";
import { count } from "drizzle-orm";

async function main() {
    const res = await db.select({ val: count() }).from(posSchema.visitorLogs);
    console.log("Visitor logs count:", res[0].val);
    
    const logs = await db.select().from(posSchema.visitorLogs).limit(5);
    console.log("Sample logs:", logs);
}

main().catch(console.error);
