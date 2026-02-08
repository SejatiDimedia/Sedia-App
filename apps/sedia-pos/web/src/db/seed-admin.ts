/**
 * Seed Admin Script
 * 
 * Creates a default admin user for the Sedia POS application.
 * Run this script when deploying to a new environment.
 * 
 * Usage: npx tsx src/db/seed-admin.ts
 * 
 * Environment Variables:
 * - ADMIN_EMAIL: Admin email (default: admin@sedia.pos)
 * - ADMIN_PASSWORD: Admin password (default: SediaAdmin123!)
 * - ADMIN_NAME: Admin name (default: Administrator)
 */

import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

import { db } from "@/lib/db";
import { user, account, appPermission } from "@/lib/schema/auth-schema";
import { outlets } from "@/lib/schema/sedia-pos";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Hash password using scrypt (same as better-auth default)
async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
}


const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sedia.pos";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "SediaAdmin123!";
const ADMIN_NAME = process.env.ADMIN_NAME || "Administrator";

async function seedAdmin() {
    console.log("🌱 Seeding Admin User...");
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Name: ${ADMIN_NAME}`);

    try {
        // 1. Check if admin already exists
        const existingUser = await db.query.user.findFirst({
            where: eq(user.email, ADMIN_EMAIL)
        });

        if (existingUser) {
            console.log("⚠️  Admin user already exists:", existingUser.email);

            // Make sure they have admin permission
            const existingPerm = await db.query.appPermission.findFirst({
                where: (p, { and, eq }) => and(
                    eq(p.userId, existingUser.id),
                    eq(p.appId, "sedia-pos")
                )
            });

            if (!existingPerm) {
                await db.insert(appPermission).values({
                    userId: existingUser.id,
                    appId: "sedia-pos",
                    role: "admin",
                    uploadEnabled: true,
                });
                console.log("✅ Added admin permission to existing user");
            } else if (existingPerm.role !== "admin") {
                await db.update(appPermission)
                    .set({ role: "admin" })
                    .where(eq(appPermission.id, existingPerm.id));
                console.log("✅ Updated existing user to admin role");
            } else {
                console.log("✅ User already has admin role");
            }

            return;
        }

        // 2. Create the user
        const userId = crypto.randomUUID();
        const hashedPassword = await hashPassword(ADMIN_PASSWORD);


        await db.insert(user).values({
            id: userId,
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            role: "admin",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        console.log("✅ Created user:", ADMIN_EMAIL);

        // 3. Create account for email/password auth
        await db.insert(account).values({
            id: crypto.randomUUID(),
            accountId: userId,
            providerId: "credential",
            userId: userId,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        console.log("✅ Created credential account");

        // 4. Create app permission with admin role
        await db.insert(appPermission).values({
            userId: userId,
            appId: "sedia-pos",
            role: "admin",
            uploadEnabled: true,
        });
        console.log("✅ Created admin permission");

        // 5. Create a default outlet for the admin
        const outletId = crypto.randomUUID();
        await db.insert(outlets).values({
            id: outletId,
            name: "Outlet Utama",
            ownerId: userId,
            address: "Alamat Default",
            phone: "",
            primaryColor: "#2e6a69",
            secondaryColor: "#f2b30c",
        });
        console.log("✅ Created default outlet: Outlet Utama");

        console.log("\n🎉 Admin user created successfully!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`   Email:    ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("\n⚠️  IMPORTANT: Change the password after first login!\n");

    } catch (error) {
        console.error("❌ Error seeding admin:", error);
        throw error;
    }
}

seedAdmin()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
