import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3 = new S3Client({
  endpoint: process.env.B2_ENDPOINT!,
  region: process.env.B2_REGION!,
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
});

export const s3Client = s3;

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "").replace(/\\/g, "/");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(key: string, body: Buffer, mime: string) {
  const finalKey = appendHashSuffix(normalizeKey(key));
  await s3.send(new PutObjectCommand({
    Bucket: process.env.B2_BUCKET_NAME,
    Key: finalKey,
    Body: body,
    ContentType: mime,
  }));
  return {
    key: finalKey,
    url: `https://${process.env.B2_BUCKET_NAME}.s3.${process.env.B2_REGION}.backblazeb2.com/${finalKey}`
  };
}

export async function storageGet(key: string) {
  const url = await getSignedUrl(s3, new GetObjectCommand({
    Bucket: process.env.B2_BUCKET_NAME,
    Key: key,
  }), { expiresIn: 3600 });
  return { key, url };
}

export async function storageDelete(key: string): Promise<boolean> {
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
    }));
    console.log(`🗑️ [Storage] Permanently deleted file from B2: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ [Storage Delete Error] for ${key}:`, error);
    return false;
  }
}

export async function storageHeadObject(key: string) {
  try {
    const response = await s3.send(new HeadObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
    }));
    return {
      exists: true,
      contentLength: response.ContentLength,
      contentType: response.ContentType,
    };
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return { exists: false };
    }
    throw error;
  }
}

export async function storageGetSignedUrl(key: string, _expiresIn = 3600): Promise<string> {
  const { url } = await storageGet(key);
  return url;
}

export async function storageGetSignedPutUrl(key: string, mimeType: string, _expiresIn = 600): Promise<{ url: string, finalKey: string }> {
  const finalKey = appendHashSuffix(normalizeKey(key));
  const url = await getSignedUrl(s3, new PutObjectCommand({
    Bucket: process.env.B2_BUCKET_NAME,
    Key: finalKey,
    ContentType: mimeType,
  }), { expiresIn: _expiresIn });
  
  return { url, finalKey };
}