import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

/**
 * Extracts the relative key from a full R2 URL.
 * If the input is not an R2 URL, it returns the input as is.
 */
export function extractR2Key(urlOrPath: string | null): string | null {
    if (!urlOrPath) return null;
    if (!urlOrPath.startsWith("http")) return urlOrPath;
    if (!urlOrPath.includes(".r2.dev")) return urlOrPath;

    try {
        const url = new URL(urlOrPath);
        return url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
    } catch (e) {
        return urlOrPath;
    }
}

/**
 * Resolves a path or old R2 URL to the current public R2 domain.
 * If the input is an external URL (not R2), it returns it as is.
 * Fallback to Signed URL if public URL is not working or not defined.
 */
export function resolveR2Url(pathOrUrl: string | null): string | null {
    if (!pathOrUrl) return null;

    // 1. If it's an external URL (not Cloudflare R2), return as is
    if (pathOrUrl.startsWith("http") && !pathOrUrl.includes(".r2.dev")) {
        return pathOrUrl;
    }

    // 2. Extract the key (relative path)
    const key = extractR2Key(pathOrUrl);
    if (!key) return pathOrUrl;

    // 3. Construct URL using CURRENT PUBLIC_URL from env
    if (PUBLIC_URL) {
        const baseUrl = PUBLIC_URL.endsWith("/") ? PUBLIC_URL.slice(0, -1) : PUBLIC_URL;
        return `${baseUrl}/${key}`;
    }

    // 4. No public URL set, return the key or original
    return pathOrUrl;
}

/**
 * Server-only version that can generate Signed URLs as fallback.
 */
export async function resolveR2UrlServer(pathOrUrl: string | null): Promise<string | null> {
    const resolved = resolveR2Url(pathOrUrl);
    if (!resolved) return null;

    // If it's an R2 URL, we could optionally force a signed URL if we know the public one is broken
    // or if we just want maximum reliability.
    if (resolved.includes(".r2.dev") || !resolved.startsWith("http")) {
        const key = extractR2Key(resolved);
        if (key) {
            try {
                return await getSignedUrl(key);
            } catch (e) {
                console.error("Failed to generate signed URL:", e);
                return resolved;
            }
        }
    }

    return resolved;
}

/**
 * Upload a file to R2
 */
export async function uploadFile(
    key: string,
    body: Buffer | Uint8Array | Blob | string,
    contentType: string
): Promise<{ key: string; url: string }> {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    await r2Client.send(command);

    // Always resolve using the current domain
    const url = resolveR2Url(key) || "";

    return { key, url };
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    await r2Client.send(command);
}

/**
 * Get a signed URL for private file access (expires in 1 hour by default)
 */
export async function getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return await awsGetSignedUrl(r2Client, command, { expiresIn });
}

/**
 * List files in a "folder" (prefix) in R2
 */
export async function listFiles(prefix: string = ""): Promise<{ key: string; size: number; lastModified: Date }[]> {
    const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
    });

    const response = await r2Client.send(command);

    return (response.Contents || []).map((item) => ({
        key: item.Key || "",
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
    }));
}

/**
 * Generate a unique file key with user ID and timestamp
 */
export function generateFileKey(userId: string, folder: string, fileName: string): string {
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `backups/${userId}/${folder}/${timestamp}-${sanitizedName}`;
}

export { r2Client, BUCKET_NAME };
