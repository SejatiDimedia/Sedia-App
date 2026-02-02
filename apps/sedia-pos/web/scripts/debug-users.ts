import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import * as authSchema from "../src/lib/schema/auth-schema";

dotenv.config({ path: ".env" });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const sql = neon(dbUrl);
const db = drizzle(sql, { schema: authSchema });

async function main() {
    console.log("Fetching users...");
    const users = await db
        .select()
        .from(authSchema.user);

    const userIds = users.map(u => u.id);
    const appPermissionsResult = userIds.length > 0 
        ? await db
            .select()
            .from(authSchema.appPermission)
            .where(eq(authSchema.appPermission.userId, userIds[0]))
        : [];
    const accountsResult = userIds.length > 0
        ? await db
            .select()
            .from(authSchema.account)
            .where(eq(authSchema.account.userId, userIds[0]))
        : [];

    console.log("\n--- USERS IN DB ---");
    users.forEach(u => {
        const userPermissions = appPermissionsResult.filter(p => p.userId === u.id);
        const userAccounts = accountsResult.filter(a => a.userId === u.id);
        console.log(`\nID: ${u.id}`);
        console.log(`Name: ${u.name}`);
        console.log(`Email: ${u.email}`);
        console.log(`Accounts: ${userAccounts.map(a => a.providerId).join(", ")}`);
        console.log(`Permissions: ${JSON.stringify(userPermissions)}`);
    });
    console.log("\n-------------------");
}

main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
