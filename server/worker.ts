import { getDb } from "./db";
import { eq, and, asc } from "drizzle-orm";
import { aiJobs, academicFiles, notifications } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { storageGetSignedUrl } from "./storage";

function extractAssistantText(result: any): string {
  const raw = result.choices[0]?.message?.content;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .filter((p: any) => typeof p === "object" && p !== null && p.type === "text")
      .map((p: any) => p.text)
      .join("\n");
  }
  return "";
}

async function processNextJob() {
  const db = await getDb();
  if (!db) return;

  try {
    const now = new Date();
    const staleTime = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago

    // 1. Find a pending job OR a stuck processing job
    const { or, lt } = await import("drizzle-orm");
    const [job] = await db
      .select()
      .from(aiJobs)
      .where(or(
        eq(aiJobs.status, "pending"),
        and(eq(aiJobs.status, "processing"), lt(aiJobs.lockedAt, staleTime))
      ))
      .orderBy(asc(aiJobs.createdAt))
      .limit(1);

    if (!job) return;

    if (job.attempts >= 3) {
      await db.update(aiJobs).set({ status: "failed", errorReason: "Max attempts reached" }).where(eq(aiJobs.id, job.id));
      return;
    }

    // 2. Mark as processing
    const lockCondition = job.status === "processing" && job.lockedAt ? eq(aiJobs.lockedAt, job.lockedAt) : undefined;
    const updateResult = await db.update(aiJobs)
      .set({ status: "processing", attempts: job.attempts + 1, lockedAt: now })
      .where(and(eq(aiJobs.id, job.id), eq(aiJobs.status, job.status), lockCondition));

    if (updateResult[0].affectedRows === 0) {
      // Another worker grabbed this job already
      return;
    }

    // 3. Get file info
    const [file] = await db
      .select()
      .from(academicFiles)
      .where(eq(academicFiles.id, job.fileId));

    if (!file) {
      await db.update(aiJobs).set({ status: "failed", errorReason: "File not found" }).where(eq(aiJobs.id, job.id));
      return;
    }

    console.log(`🤖 [AI Worker] Processing file ${file.id} (${file.fileName})...`);

    // 4. Generate presigned URL for the LLM to access the image
    const signedUrl = await storageGetSignedUrl(file.fileKey, 3600);

    // 5. Invoke LLM
    const result = await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "صف محتوى هذه الصورة الأكاديمي باختصار بالعربية (اسم المادة، الموضوع، أو أي معلومات تفيد في أرشفة الملف). اكتب الملخص مباشرة بدون مقدمات.",
            },
            {
              type: "image_url",
              image_url: {
                url: signedUrl,
              },
            },
          ],
        },
      ],
    });

    const summary = extractAssistantText(result).trim();

    // 6. Update file description
    if (summary) {
      const newDesc = file.description ? `${file.description}\n\n[تحليل الذكاء الاصطناعي]: ${summary}` : `[تحليل الذكاء الاصطناعي]: ${summary}`;
      await db.update(academicFiles)
        .set({ description: newDesc })
        .where(eq(academicFiles.id, file.id));
        
      // Notify uploader
      await db.insert(notifications).values({
        userId: file.uploadedByStudentID,
        type: "SYSTEM",
        message: `اكتمل تحليل الذكاء الاصطناعي لملفك "${file.fileName}". تمت إضافة الوصف بنجاح.`,
      } as any);
    }

    // 7. Mark as completed
    await db.update(aiJobs)
      .set({ status: "completed" })
      .where(eq(aiJobs.id, job.id));

    console.log(`✅ [AI Worker] Successfully processed file ${file.id}`);

  } catch (err: any) {
    const isNetworkError = err.cause && ["ECONNRESET", "ENOTFOUND", "ETIMEDOUT", "HANDSHAKE_SSL_ERROR"].includes(err.cause.code);
    if (isNetworkError || err.code === "ECONNREFUSED") {
      console.warn(`⚠️ [AI Worker] Database connection unavailable (${err.cause?.code || err.code}). Retrying...`);
    } else {
      console.error("❌ [AI Worker Error]:", err);
    }
  }
}

let workerInterval: NodeJS.Timeout | null = null;

export function startAIWorker() {
  if (workerInterval) return;
  console.log("🚀 [AI Worker] Starting background job processor...");
  
  workerInterval = setInterval(async () => {
    await processNextJob();
  }, 10000); // Check every 10 seconds
}

export function stopAIWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log("🛑 [AI Worker] Stopped.");
  }
}
