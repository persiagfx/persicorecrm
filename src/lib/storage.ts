import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

type StorageProvider = "s3" | "r2" | "minio" | "local";

function getProvider(): StorageProvider {
  const p = process.env.STORAGE_PROVIDER as StorageProvider | undefined;
  if (p === "s3" || p === "r2" || p === "minio") return p;
  return "local";
}

// ─── Local ────────────────────────────────────────────────────────────────────

async function localUpload(file: Buffer, key: string): Promise<string> {
  const dir = join(process.cwd(), "public", "uploads", key.split("/").slice(0, -1).join("/"));
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  await writeFile(join(process.cwd(), "public", "uploads", key), file);
  return `/uploads/${key}`;
}

async function localDelete(key: string): Promise<void> {
  const { unlink } = await import("fs/promises");
  const filePath = join(process.cwd(), "public", "uploads", key);
  try {
    await unlink(filePath);
  } catch {
    // ignore if not found
  }
}

function localGetUrl(key: string): string {
  return `/uploads/${key}`;
}

// ─── S3 ───────────────────────────────────────────────────────────────────────

async function s3Upload(file: Buffer, key: string, mimeType: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3") as any;
  const bucket = process.env.AWS_BUCKET!;
  const region = process.env.AWS_REGION!;
  const client = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: file, ContentType: mimeType })
  );
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function s3Delete(key: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3") as any;
  const bucket = process.env.AWS_BUCKET!;
  const client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

function s3GetUrl(key: string): string {
  const bucket = process.env.AWS_BUCKET!;
  const region = process.env.AWS_REGION!;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

// ─── R2 ───────────────────────────────────────────────────────────────────────

async function r2Upload(file: Buffer, key: string, mimeType: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3") as any;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const bucket = process.env.R2_BUCKET!;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: file, ContentType: mimeType })
  );
  // Public R2 URL (assumes public bucket or custom domain via R2_PUBLIC_URL env)
  const base = process.env.R2_PUBLIC_URL ?? `https://pub-${accountId}.r2.dev`;
  return `${base}/${key}`;
}

async function r2Delete(key: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3") as any;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const bucket = process.env.R2_BUCKET!;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

function r2GetUrl(key: string): string {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
  const base = process.env.R2_PUBLIC_URL ?? `https://pub-${accountId}.r2.dev`;
  return `${base}/${key}`;
}

// ─── MinIO (S3-compatible with custom endpoint) ───────────────────────────────

async function minioUpload(file: Buffer, key: string, mimeType: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3") as any;
  const bucket = process.env.MINIO_BUCKET!;
  const endpoint = process.env.MINIO_ENDPOINT!;
  const client = new S3Client({
    endpoint,
    region: process.env.MINIO_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY!,
      secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
    forcePathStyle: true,
  });
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: file, ContentType: mimeType })
  );
  const publicUrl = process.env.MINIO_PUBLIC_URL ?? endpoint;
  return `${publicUrl}/${bucket}/${key}`;
}

async function minioDelete(key: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3") as any;
  const bucket = process.env.MINIO_BUCKET!;
  const client = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT!,
    region: process.env.MINIO_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY!,
      secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
    forcePathStyle: true,
  });
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

function minioGetUrl(key: string): string {
  const endpoint = process.env.MINIO_ENDPOINT ?? "";
  const bucket = process.env.MINIO_BUCKET ?? "";
  const publicUrl = process.env.MINIO_PUBLIC_URL ?? endpoint;
  return `${publicUrl}/${bucket}/${key}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function uploadFile(
  file: Buffer,
  key: string,
  mimeType: string
): Promise<string> {
  const provider = getProvider();
  try {
    if (provider === "s3") return await s3Upload(file, key, mimeType);
    if (provider === "r2") return await r2Upload(file, key, mimeType);
    if (provider === "minio") return await minioUpload(file, key, mimeType);
    return await localUpload(file, key);
  } catch (err) {
    if (provider !== "local") {
      console.warn(`[storage] ${provider} failed, falling back to local:`, err);
      return await localUpload(file, key);
    }
    throw err;
  }
}

export async function deleteFile(key: string): Promise<void> {
  const provider = getProvider();
  try {
    if (provider === "s3") return await s3Delete(key);
    if (provider === "r2") return await r2Delete(key);
    if (provider === "minio") return await minioDelete(key);
    return await localDelete(key);
  } catch (err) {
    if (provider !== "local") {
      console.warn(`[storage] ${provider} delete failed, trying local:`, err);
      return await localDelete(key);
    }
    throw err;
  }
}

export function getFileUrl(key: string): string {
  const provider = getProvider();
  if (provider === "s3") return s3GetUrl(key);
  if (provider === "r2") return r2GetUrl(key);
  if (provider === "minio") return minioGetUrl(key);
  return localGetUrl(key);
}
