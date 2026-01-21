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
    endpoint: `https://${import.meta.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: import.meta.env.R2_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = import.meta.env.R2_BUCKET_NAME;
const PUBLIC_URL = import.meta.env.R2_PUBLIC_URL;

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

    // Return public URL if available, otherwise use signed URL approach
    const url = PUBLIC_URL ? `${PUBLIC_URL}/${key}` : await getSignedUrl(key);
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
        Delimiter: "/",
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
export function generateFileKey(userId: string, fileName: string): string {
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `users/${userId}/${timestamp}-${sanitizedName}`;
}

export { r2Client, BUCKET_NAME };
