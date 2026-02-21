import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET_NAME } from "@/lib/storage";

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ key: string[] }> }
) {
    const params = await props.params;
    const key = params.key.join("/");

    if (!key) {
        return new NextResponse("Missing key", { status: 400 });
    }

    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const response = await r2Client.send(command);

        if (!response.Body) {
            return new NextResponse("Not found", { status: 404 });
        }

        // Convert ReadableStream to Response
        const stream = response.Body as any;

        return new NextResponse(stream, {
            headers: {
                "Content-Type": response.ContentType || "application/octet-stream",
                "Content-Length": response.ContentLength?.toString() || "",
                "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
            },
        });
    } catch (error) {
        console.error("[Storage Proxy] Error fetching key:", key, error);
        return new NextResponse("Error fetching file", { status: 500 });
    }
}
