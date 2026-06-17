/**
 * File storage using Cloudflare R2 (S3-compatible).
 * Required env vars:
 *   R2_ACCOUNT_ID      - Cloudflare account ID
 *   R2_ACCESS_KEY_ID   - R2 API token access key
 *   R2_SECRET_ACCESS_KEY - R2 API token secret
 *   R2_BUCKET_NAME     - R2 bucket name
 *   R2_PUBLIC_URL      - Public URL for the bucket (e.g. https://pub-xxx.r2.dev)
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 config missing: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY",
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME env var not set");
  return bucket;
}

function getPublicUrl(): string {
  return (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

/**
 * Upload a file to R2.
 * Returns { key, url } where url is the public URL for the file.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const client = getR2Client();
  const bucket = getBucketName();
  const key = appendHashSuffix(normalizeKey(relKey));

  const body =
    typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  const publicBase = getPublicUrl();
  const url = publicBase ? `${publicBase}/${key}` : `/storage/${key}`;

  return { key, url };
}

/**
 * Get the public URL for an existing R2 object.
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const publicBase = getPublicUrl();
  const url = publicBase ? `${publicBase}/${key}` : `/storage/${key}`;
  return { key, url };
}

/**
 * Get a time-limited presigned URL for a private R2 object (expires in 1 hour by default).
 */
export async function storageGetSignedUrl(
  relKey: string,
  expiresIn = 3600,
): Promise<string> {
  const client = getR2Client();
  const bucket = getBucketName();
  const key = normalizeKey(relKey);

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}
