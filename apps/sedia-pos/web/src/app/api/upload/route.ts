import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadFile } from "@/lib/storage";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
        }

        // Limit file size (e.g., 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const key = `products/${session.user.id}/${timestamp}-${sanitizedName}`;

        const { url } = await uploadFile(key, buffer, file.type);

        console.log("Upload successful:", { key, url });

        return NextResponse.json({ key, url });
    } catch (error) {
        console.error("Upload route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
