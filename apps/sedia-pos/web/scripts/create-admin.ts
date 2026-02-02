import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as dotenv from "dotenv";
import { eq, and } from "drizzle-orm";

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
    const email = "sejatidimedia@gmail.com";
    const appId = "sedia-pos";
    const name = "Sejati Dimedia (Admin)";

    console.log(`Checking user: ${email}...`);

    // 1. Check/Create User
    let userResult = await db
        .select()
        .from(authSchema.user)
        .where(eq(authSchema.user.email, email))
        .limit(1);

    let user = userResult[0] || null;

    if (!user) {
        console.log("User not found. Creating...");
        const [newUser] = await db.insert(authSchema.user).values({
            id: crypto.randomUUID(),
            name,
            email,
            emailVerified: true,
        }).returning();
        user = newUser;
        console.log(`User created with ID: ${user.id}`);
    } else {
        console.log(`User found with ID: ${user.id}`);
    }

    // 2. Check/Create Permission
    console.log(`Checking permission for app: ${appId}...`);

    const permissionResult = await db
        .select()
        .from(authSchema.appPermission)
        .where(and(
            eq(authSchema.appPermission.userId, user.id),
            eq(authSchema.appPermission.appId, appId)
        ))
        .limit(1);

    const permission = permissionResult[0] || null;

    if (!permission) {
        console.log("Permission not found. Creating admin permission...");
        await db.insert(authSchema.appPermission).values({
            userId: user.id,
            appId,
            role: "admin",
            uploadEnabled: true,
            storageLimit: 1073741824, // 1GB
        });
        console.log("Admin permission created.");
    } else {
        if (permission.role !== "admin") {
            console.log(`Permission exists but role is ${permission.role}. Updating to admin...`);
            await db.update(authSchema.appPermission)
                .set({ role: "admin" })
                .where(eq(authSchema.appPermission.id, permission.id));
            console.log("Permission updated.");
        } else {
            console.log("User is already an admin for this app.");
        }
    }

    console.log("Done.");
}

main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
