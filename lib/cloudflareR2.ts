import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// Cloudflare R2 S3-Compatible Configuration
const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || "";
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || "doxera-documents";
const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || "";

/**
 * Checks whether Cloudflare R2 credentials are configured
 */
export function isCloudflareR2Configured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey);
}

/**
 * Returns an instantiated S3Client configured for Cloudflare R2
 */
function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export interface UploadResult {
  fileUrl: string;
  key: string;
  storage: "cloudflare_r2" | "local_data_url";
}

/**
 * Uploads an exact file buffer to Cloudflare R2 without any modifications.
 * Preserves the exact bytes, content type, and sanitized filename.
 */
export async function uploadFileToCloudflareR2(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  llcId: string;
}): Promise<UploadResult> {
  const { buffer, fileName, contentType, llcId } = params;

  // Sanitize filename to prevent directory traversal
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const key = `llc-documents/${llcId}/${timestamp}-${cleanName}`;

  if (isCloudflareR2Configured()) {
    try {
      const client = getR2Client();
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType || "application/octet-stream",
        Metadata: {
          originalName: fileName,
          llcId,
          uploadedAt: new Date().toISOString(),
        },
      });

      await client.send(command);

      // Build file URL: Use public URL if provided, or download proxy endpoint
      let fileUrl = "";
      if (publicUrl) {
        const base = publicUrl.endsWith("/") ? publicUrl.slice(0, -1) : publicUrl;
        fileUrl = `${base}/${key}`;
      } else {
        fileUrl = `/api/documents/download?key=${encodeURIComponent(key)}&filename=${encodeURIComponent(fileName)}`;
      }

      return {
        fileUrl,
        key,
        storage: "cloudflare_r2",
      };
    } catch (err) {
      console.error("[Cloudflare R2] Failed to upload file to R2 bucket:", err);
      // Fallback to Data URL if Cloudflare R2 call fails
      const base64 = buffer.toString("base64");
      const mime = contentType || "application/octet-stream";
      return {
        fileUrl: `data:${mime};base64,${base64}`,
        key,
        storage: "local_data_url",
      };
    }
  }

  // If Cloudflare R2 credentials have not yet been placed into .env.local,
  // store exact data URL so system continues working seamlessly while awaiting user's env configuration.
  const base64 = buffer.toString("base64");
  const mime = contentType || "application/octet-stream";
  return {
    fileUrl: `data:${mime};base64,${base64}`,
    key,
    storage: "local_data_url",
  };
}

/**
 * Downloads an exact file from Cloudflare R2 by key
 */
export async function getFileFromCloudflareR2(key: string): Promise<{
  body: Uint8Array | null;
  contentType?: string;
  originalName?: string;
}> {
  if (!isCloudflareR2Configured()) {
    return { body: null };
  }

  try {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await client.send(command);
    if (!response.Body) return { body: null };

    const byteArray = await response.Body.transformToByteArray();
    return {
      body: byteArray,
      contentType: response.ContentType,
      originalName: response.Metadata?.originalname,
    };
  } catch (err) {
    console.error("[Cloudflare R2] Failed to fetch file:", err);
    return { body: null };
  }
}
