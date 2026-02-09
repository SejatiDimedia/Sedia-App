import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { deleteFile } from "@/lib/storage";

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { key } = await req.json();

        if (!key) {
            return NextResponse.json({ error: "Key is required" }, { status: 400 });
        }

        // Basic security check: ensure it starts with 'products/' or 'backups/'
        // to prevent deleting unauthorized files if keys are guessed
        if (!key.startsWith("products/") && !key.startsWith("backups/")) {
            return NextResponse.json({ error: "Unauthorized key path" }, { status: 403 });
        }

        console.log(`[API] Deleting R2 object: ${key} (requested by ${session.user.id})`);
        await deleteFile(key);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting from R2:", error);
        return NextResponse.json({ error: "Failed to delete from R2" }, { status: 500 });
    }
}
