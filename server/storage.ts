import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// مسار المجلد الذي سيتم حفظ الملفات فيه
// في Railway، نستخدم /tmp لأنه المجلد الوحيد القابل للكتابة
const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_STATIC_URL;
const UPLOAD_DIR = isRailway
  ? path.join("/tmp", "uploads")
  : path.join(process.cwd(), "uploads");

// تأكد من وجود المجلد عند بدء التشغيل
(async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    console.log(`📁 [Storage] Upload directory ready: ${UPLOAD_DIR}`);
  } catch (err) {
    console.warn(`⚠️ [Storage] Could not create upload dir: ${UPLOAD_DIR}`, err);
  }
})();

async function ensureUploadDir(subPath = "") {
  const fullPath = subPath ? path.join(UPLOAD_DIR, subPath) : UPLOAD_DIR;
  await fs.mkdir(fullPath, { recursive: true });
  return fullPath;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "").replace(/\\/g, "/");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  try {
    const key = appendHashSuffix(normalizeKey(relKey));
    const dirPath = path.dirname(key);
    await ensureUploadDir(dirPath === "." ? "" : dirPath);

    const filePath = path.join(UPLOAD_DIR, key);

    let bufferData: Buffer;
    if (typeof data === "string") {
      bufferData = Buffer.from(data, "utf-8");
    } else if (data instanceof Uint8Array) {
      bufferData = Buffer.from(data);
    } else {
      bufferData = data;
    }

    await fs.writeFile(filePath, bufferData, { mode: 0o644 });

    const url = `/uploads/${key}`;
    console.log(`✅ [Storage] File saved: ${filePath} → ${url}`);
    return { key, url };
  } catch (error: any) {
    console.error(`❌ [Storage] Write failed for ${relKey}:`, error.code, error.message);
    throw new Error(`فشل في حفظ الملف: ${error.message}`);
  }
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/uploads/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  return `/uploads/${key}`;
}