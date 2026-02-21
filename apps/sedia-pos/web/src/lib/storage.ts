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
 * Checks if a URL/path is an R2-related resource (r2.dev or cloudflarestorage).
 */
function isR2Url(url: string): boolean {
    if (!url) return false;
    return (
        url.includes(".r2.dev") ||
        url.includes(".r2.cloudflarestorage.com") ||
        url.includes("cloudflarestorage.com")
    );
}

/**
 * Extracts the relative key from a full R2 URL.
 * Handles both public (.r2.dev) and signed (.r2.cloudflarestorage.com) URLs.
 * If the input is not an R2 URL, it returns the input as is.
 */
export function extractR2Key(urlOrPath: string | null): string | null {
    if (!urlOrPath) return null;
    if (!urlOrPath.startsWith("http")) return urlOrPath; // Already a clean key
    if (!isR2Url(urlOrPath)) return urlOrPath; // External URL, return as-is

    try {
        const url = new URL(urlOrPath);
        // pathname starts with /, remove leading slash to get the key
        return url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
    } catch (e) {
        return urlOrPath;
    }
}

/**
 * Resolves a path or old R2 URL to the current public R2 domain or internal proxy.
 * If the input is an external URL (not R2), it returns it as is.
 */
export function resolveR2Url(pathOrUrl: string | null): string | null {
    if (!pathOrUrl) return null;

    // 1. If it's an external URL (not Cloudflare R2), return as is
    if (pathOrUrl.startsWith("http") && !isR2Url(pathOrUrl)) {
        return pathOrUrl;
    }

    // 2. Extract the key (relative path)
    const key = extractR2Key(pathOrUrl);
    if (!key || key.startsWith("http")) return pathOrUrl;

    // 3. Prefer internal proxy for better Next.js Image Optimization compatibility
    // Using absolute URL if defined, otherwise relative path
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    return `${baseUrl}/api/storage/${key}`;
}

/**
 * Server-only version that ALWAYS generates fresh Signed URLs for R2 keys.
 * This ensures images work even if the public R2 URL is disabled.
 */
export async function resolveR2UrlServer(pathOrUrl: string | null): Promise<string | null> {
    if (!pathOrUrl) return null;

    // If it's an external URL (e.g. Unsplash), return as-is
    if (pathOrUrl.startsWith("http") && !isR2Url(pathOrUrl)) {
        return pathOrUrl;
    }

    // Extract clean key from any R2 URL format or plain key
    const key = extractR2Key(pathOrUrl);
    if (!key || key.startsWith("http")) return pathOrUrl;

    // Always generate a fresh signed URL for maximum reliability
    try {
        const signedUrl = await getSignedUrl(key);
        return signedUrl;
    } catch (e) {
        console.error(`[R2 Storage] Failed to generate signed URL for key: "${key}"`, e);
        // Fallback to public URL
        const fallback = resolveR2Url(pathOrUrl);
        console.log(`[R2 Storage] Falling back to public URL: ${fallback}`);
        return fallback;
    }
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
