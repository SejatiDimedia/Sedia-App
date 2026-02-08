
/**
 * Transfer Superuser Script
 * 
 * Transfers all assets (outlets, permissions) from an old Superuser (e.g. developer) 
 * to a new Owner (e.g. client).
 * 
 * Usage:
 * npx tsx src/scripts/transfer-superuser.ts <OLD_EMAIL> <NEW_EMAIL> [NEW_NAME]
 * 
 * Example:
 * npx tsx src/scripts/transfer-superuser.ts sejatidimedia@gmail.com client@tokobaru.com "Budi Santoso"
 */

import { config } from "dotenv";
config({ path: ".env" });

import { db } from "@/lib/db";
import { user, account, appPermission } from "@/lib/schema/auth-schema";
import { outlets, employees } from "@/lib/schema/sedia-pos";
import { eq, and } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("❌ Usage: npx tsx src/scripts/transfer-superuser.ts <OLD_EMAIL> <NEW_EMAIL> [NEW_NAME]");
        process.exit(1);
    }

    const [oldEmail, newEmail, newName] = args;
    const defaultPassword = "SediaPassword123!"; // Default prompt to change

    console.log(`\n🔄 STARTING TRANSFER: ${oldEmail} -> ${newEmail}\n`);

    try {
        // 1. Check Old User
        const oldUser = await db.query.user.findFirst({
            where: (u, { eq }) => eq(u.email, oldEmail)
        });

        if (!oldUser) {
            console.error(`❌ Old user (${oldEmail}) not found!`);
            // Proceeding anyway might be dangerous? No, maybe we just want to create new user?
            console.log("⚠️  Proceeding to promote new user anyway...");
        } else {
            console.log(`✅ Found old user: ${oldUser.name} (${oldUser.id})`);
        }

        // 2. Find or Create New User
        let newUser = await db.query.user.findFirst({
            where: (u, { eq }) => eq(u.email, newEmail)
        });

        if (!newUser) {
            console.log("🆕 New user not found. Creating...");
            const userId = crypto.randomUUID();
            const hashedPassword = await hashPassword(defaultPassword);

            await db.insert(user).values({
                id: userId,
                name: newName || "New Owner",
                email: newEmail,
                role: "admin",
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Create credential account
            await db.insert(account).values({
                id: crypto.randomUUID(),
                accountId: userId,
                providerId: "credential",
                userId: userId,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Create App Permission
            await db.insert(appPermission).values({
                userId: userId,
                appId: "sedia-pos",
                role: "admin",
                uploadEnabled: true,
            });

            console.log(`✅ Created new user with password: ${defaultPassword}`);

            // Re-fetch to be sure
            newUser = await db.query.user.findFirst({
                where: (u, { eq }) => eq(u.email, newEmail)
            });
        } else {
            console.log(`✅ Found existing new user: ${newUser.name}`);

            // Ensure they are Admin
            const perm = await db.query.appPermission.findFirst({
                where: and(eq(appPermission.userId, newUser.id), eq(appPermission.appId, "sedia-pos"))
            });

            if (!perm) {
                await db.insert(appPermission).values({
                    userId: newUser.id,
                    appId: "sedia-pos",
                    role: "admin",
                    uploadEnabled: true,
                });
            } else if (perm.role !== "admin") {
                await db.update(appPermission).set({ role: "admin" }).where(eq(appPermission.id, perm.id));
            }
            console.log("✅ Ensured new user is Admin.");
        }

        if (!newUser) throw new Error("Failed to get new user record");

        // 3. Transfer Outlet Ownership
        if (oldUser) {
            console.log("🔄 Transferring Outlets...");
            const outletsResult = await db.update(outlets)
                .set({ ownerId: newUser.id, updatedAt: new Date() })
                .where(eq(outlets.ownerId, oldUser.id))
                .returning();

            console.log(`✅ Transferred ${outletsResult.length} outlets to new owner.`);
            outletsResult.forEach(o => console.log(`   - ${o.name}`));
        }

        // 4. (Optional) Downgrade Old User
        if (oldUser) {
            // Remove admin permission or set to user?
            // Safer to just set to 'user' so they don't lose access completely but lose power.
            // Or delete? Let's just prompt manually.

            console.log("\n⚠️  Old user still exists as Admin/User.");
            console.log("   To strictly remove access, you should delete the old user or downgrade them manually.");

            // Auto-downgrade app permission to be safe
            await db.update(appPermission)
                .set({ role: "user" })
                .where(and(eq(appPermission.userId, oldUser.id), eq(appPermission.appId, "sedia-pos")));
            console.log(`✅ Downgraded old user (${oldEmail}) to 'user' role for safety.`);
        }

        console.log("\n🎉 Transfer Complete!");
        console.log(`New Owner: ${newEmail}`);
        if (!process.env.ADMIN_PASSWORD) {
            console.log(`Password (if created new): ${defaultPassword}`);
        }

    } catch (e) {
        console.error("Error during transfer:", e);
    }
    process.exit(0);
}

main();
