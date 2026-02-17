import type { APIRoute } from "astro";
import { auth } from "../../lib/auth";
import { db, schema } from "../../lib/db";
import { eq } from "drizzle-orm";

export const GET: APIRoute = async (context) => {
    try {
        const email = "noltpedia@admin.com";

        // 1. Unconditionally try to create user, ignore if exists
        try {
            await auth.api.signUpEmail({
                body: {
                    email,
                    password: "123123123",
                    name: "Admin NoltPedia",
                },
                headers: context.request.headers,
            });
        } catch (e) {
            // Ignore error if user exists, proceed to permission assignment
            console.log("User might already exist, proceeding to permission...");
        }

        // 2. Fetch the user ID
        const user = await db.query.user.findFirst({
            where: eq(schema.user.email, email),
        });

        if (!user) {
            return new Response("User created but not found in DB?", { status: 500 });
        }

        // 3. Assign Admin Role for 'noltpedia'
        await db.insert(schema.appPermission).values({
            userId: user.id,
            appId: "noltpedia",
            role: "admin", // Changed from superadmin as requested
            uploadEnabled: true,
            storageLimit: 1073741824, // 1GB
        }).onConflictDoNothing();

        return new Response(`Admin seeded successfully!\nEmail: ${email}\nRole: admin\nApp: noltpedia`, { status: 200 });
    } catch (e: any) {
        return new Response("Error: " + e.message, { status: 500 });
    }
};
