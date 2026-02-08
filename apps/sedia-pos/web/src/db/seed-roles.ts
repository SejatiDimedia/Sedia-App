
import { config } from "dotenv";
config({ path: ".env" }); // Try .env
config({ path: ".env.local" }); // Try .env.local override
import { db } from "@/lib/db";
import { roles } from "@/lib/schema/sedia-pos";

async function seedRoles() {
    console.log("Seeding Roles...");

    const defaultRoles = [
        {
            name: "Manager",
            description: "Full access to dashboard and settings",
            isSystem: true,
            permissions: JSON.stringify([
                "access_pos",
                "manage_products",
                "manage_inventory",
                "manage_customers",
                "manage_employees",
                "view_reports",
                "manage_outlets",
                "manage_tax",
                "manage_stock_opname"
            ]),
        },
        {
            name: "Cashier",
            description: "Access to POS and basic transaction history",
            isSystem: true,
            permissions: JSON.stringify(["access_pos"]),
        },
        {
            name: "Warehouse Staff",
            description: "Manage inventory, stock opname, and purchase orders",
            isSystem: true,
            permissions: JSON.stringify([
                "manage_inventory",
                "manage_stock_opname",
                "manage_products" // Needed to view products list? Yes.
            ]),
        }
    ];

    for (const role of defaultRoles) {
        // Check if exists by name
        const existing = await db.query.roles.findFirst({
            where: (roles, { eq }) => eq(roles.name, role.name)
        });

        if (!existing) {
            await db.insert(roles).values(role);
            console.log(`Created role: ${role.name}`);
        } else {
            console.log(`Role already exists: ${role.name}`);
            // Optional: Update permissions if needed
            // await db.update(roles).set({ permissions: role.permissions }).where(eq(roles.id, existing.id));
        }
    }

    console.log("Roles seeded successfully.");
}

seedRoles().catch(console.error);
