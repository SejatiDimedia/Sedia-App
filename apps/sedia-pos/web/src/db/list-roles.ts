
import { config } from "dotenv";
config({ path: ".env" });
import { db } from "@/lib/db";

async function listRoles() {
    const allRoles = await db.query.roles.findMany({
        columns: { id: true, name: true, isSystem: true }
    });
    console.log(JSON.stringify(allRoles, null, 2));
}

listRoles().catch(console.error);
