import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// مسار المجلد الذي سيتم حفظ الملفات فيه (المجلد الرئيسي uploads)
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// دالة للتأكد من إنشاء المجلد إذا لم يكن موجوداً
async function ensureUploadDir(subPath = "") {
  const fullPath = path.join(UPLOAD_DIR, subPath);
  await fs.mkdir(fullPath, { recursive: true });
  return fullPath;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

// دالة لإضافة رمز عشوائي لاسم الملف لمنع تكرار الأسماء
function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

// دالة رفع الملف (تم تحويلها للحفظ المحلي)
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  try {
    const key = appendHashSuffix(normalizeKey(relKey));

    // إنشاء المجلدات الفرعية بناءً على مسار الملف
    const dirPath = path.dirname(key);
    await ensureUploadDir(dirPath);

    const filePath = path.join(UPLOAD_DIR, key);

    // تحويل البيانات إلى Buffer لحفظها كملف
    let bufferData: Buffer;
    if (typeof data === "string") {
      bufferData = Buffer.from(data, "utf-8");
    } else if (data instanceof Uint8Array) {
      bufferData = Buffer.from(data);
    } else {
      bufferData = data;
    }

    // حفظ الملف في جهازك
    await fs.writeFile(filePath, bufferData);

    // إرجاع الرابط المحلي لكي يتمكن المتصفح من قراءته
    return { key, url: `/uploads/${key}` };
  } catch (error) {
    console.error("Local Storage Error:", error);
    throw new Error("فشل في حفظ الملف محلياً");
  }
}

// دالة جلب الملف
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/uploads/${key}` };
}

// دالة جلب الرابط
export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  return `/uploads/${key}`;
}