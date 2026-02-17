import { db } from "../src/lib/db";
import { schema } from "../src/lib/db";

async function main() {
    const topics = await db.query.topics.findMany();
    console.log(JSON.stringify(topics, null, 2));
}

main().catch(console.error);
