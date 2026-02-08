
import { config } from "dotenv";
config({ path: ".env" });
import { db } from "@/lib/db";
import { roles, employees } from "@/lib/schema/sedia-pos";
import { eq } from "drizzle-orm";

async function deleteDuplicateRole() {
    const roleName = "Kasir";
    const keepRoleName = "Cashier";

    // Find the role to delete
    const roleToDelete = await db.query.roles.findFirst({
        where: eq(roles.name, roleName)
    });

    if (!roleToDelete) {
        console.log(`Role '${roleName}' not found.`);
        return;
    }

    // Find the role to keep (fallback)
    const roleToKeep = await db.query.roles.findFirst({
        where: eq(roles.name, keepRoleName)
    });

    if (!roleToKeep) {
        console.log(`Role '${keepRoleName}' not found. Cannot migrate employees.`);
        return;
    }

    console.log(`Deleting role '${roleName}' (${roleToDelete.id})...`);
    console.log(` migrating employees to '${keepRoleName}' (${roleToKeep.id})...`);

    // Migrate employees
    await db.update(employees)
        .set({ roleId: roleToKeep.id })
        .where(eq(employees.roleId, roleToDelete.id));

    // Delete role
    await db.delete(roles).where(eq(roles.id, roleToDelete.id));

    console.log("Done.");
}

deleteDuplicateRole().catch(console.error);
