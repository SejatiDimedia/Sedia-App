import { S3Client, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

// The 10 missing products from verification
const missingKeys = [
    "products/9VwxYQKYo8VWF5DsBa9kZM0JSMnf7blO/1771239663842-Screenshot_20260216_182813.jpg",
    "products/9VwxYQKYo8VWF5DsBa9kZM0JSMnf7blO/1771250759732-Screenshot_20260216_215351.jpg",
    "products/9VwxYQKYo8VWF5DsBa9kZM0JSMnf7blO/1771244835629-Screenshot_20260216_201527.jpg",
    "products/9VwxYQKYo8VWF5DsBa9kZM0JSMnf7blO/1771250822544-Screenshot_20260216_215327.jpg",
    "products/9VwxYQKYo8VWF5DsBa9kZM0JSMnf7blO/1771250966655-Screenshot_20260216_220342.jpg",
    "products/9VwxYQKYo8VWF5DsBa9kZM0JSMnf7blO/1771250925406-Screenshot_20260216_215306.jpg",
    "products/9VwxYQKYo8VWF5DsBa9kZM0JSMnf7blO/1771251003875-Screenshot_20260216_215458.jpg",
    "products/9VwxYQKYo8VWF5DsBa9kZM0JSMnf7blO/1771242334861-Screenshot_20260216_194522.jpg",
    "products/9VwxYQKYo8VWF5DsBa9kZM0JSMnf7blO/1771250704724-Screenshot_20260216_215217.jpg",
    "products/9VwxYQKYo8VWF5DsBa9kZM0JSMnf7blO/1771250880889-Screenshot_20260216_215422.jpg",
];

async function investigateMissing() {
    console.log("=== Investigating Missing Files ===\n");

    // List ALL files in bucket with prefix
    const cmd = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: "products/" });
    const response = await r2Client.send(cmd);
    const allKeys = new Set((response.Contents || []).map(item => item.Key));

    console.log(`Total files in products/ folder: ${allKeys.size}`);
    console.log("\nAll files in R2:");
    (response.Contents || []).forEach(item => {
        console.log(`  ${item.Key} (${item.Size} bytes, modified: ${item.LastModified?.toISOString()})`);
    });

    console.log("\n\nChecking each missing file:");
    for (const key of missingKeys) {
        const exists = allKeys.has(key);

        if (!exists) {
            // Try HeadObject for definitive check
            try {
                const headCmd = new HeadObjectCommand({ Bucket: BUCKET, Key: key });
                await r2Client.send(headCmd);
                console.log(`  ✅ FOUND (HeadObject): ${key}`);
            } catch (e: any) {
                if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
                    console.log(`  ❌ CONFIRMED MISSING: ${key}`);
                } else {
                    console.log(`  ⚠️ ERROR checking: ${key} → ${e.message}`);
                }
            }
        } else {
            console.log(`  ✅ EXISTS: ${key}`);
        }
    }
}

investigateMissing().catch(console.error);
