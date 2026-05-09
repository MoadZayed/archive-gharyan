console.log("[DEBUG] server/index.ts is being executed...");
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { registerOAuthRoutes } from "./_core/oauth";
import path from "path";
import { fileURLToPath } from "url";
import { setupVite, serveStatic } from "./_core/vite";
import multer from "multer";
import crypto from "crypto";
import { storagePut } from "./storage";
import * as db from "./db";

// Configure multer for memory storage with strict validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png"
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مسموح به أكاديمياً. يرجى رفع ملفات PDF, Word, PowerPoint أو صور فقط."));
    }
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("[Server] Starting initialization...");
  const app = express();
  const server = createServer(app);
  console.log("[Server] HTTP Server created.");

  // ✅ CORS قبل كل شيء
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  console.log("[Server] Middleware configured.");

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ✅ Security: Simple Rate Limiter to prevent brute-force
  const requestCounts = new Map<string, { count: number; lastReset: number }>();
  const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  const MAX_REQUESTS = 100; // max 100 requests per minute per IP

  app.use((req, res, next) => {
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const stats = requestCounts.get(ip) || { count: 0, lastReset: now };

    if (now - stats.lastReset > RATE_LIMIT_WINDOW) {
      stats.count = 0;
      stats.lastReset = now;
    }

    stats.count++;
    requestCounts.set(ip, stats);

    if (stats.count > MAX_REQUESTS) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${ip}`);
      return res.status(429).json({ error: "تم تجاوز حد الطلبات المسموح به. يرجى المحاولة لاحقاً." });
    }
    next();
  });

  // ✅ OAuth Routes
  registerOAuthRoutes(app);

  // ✅ health check للتأكد أن السيرفر يعمل
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ✅ Binary Upload Route (Enterprise Grade)
  app.post("/api/upload-binary", (req, res) => {
    upload.single("file")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      try {
        if (!req.file) {
          return res.status(400).json({ error: "لم يتم استلام أي ملف" });
        }

        const fileKey = `files/binary/${Date.now()}-${req.file.originalname}`;
        const result = await storagePut(fileKey, req.file.buffer, req.file.mimetype);

        // Generate Hash for deduplication
        const fileHash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");

        res.json({ 
          success: true, 
          key: result.key, 
          url: result.url,
          fileHash,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size
        });
      } catch (error) {
        console.error("Binary Upload Error:", error);
        res.status(500).json({ error: "فشل رفع الملف برمجياً" });
      }
    });
  });

  // ✅ TRPC يجب أن يكون قبل setupVite
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path }) {
        // ✅ لوغ واضح لأخطاء الـ API
        console.error(`❌ TRPC Error on [${path}]:`, error.message);
      },
    })
  );

  // ✅ Global Error Handler (CTO Logging)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    
    console.error(`[${timestamp}] ❌ Critical Error: ${method} ${url}`);
    console.error(`Message: ${err.message}`);
    console.error(`Stack: ${err.stack}`);

    res.status(500).json({ 
      error: "حدث خطأ غير متوقع في السيرفر الداخلي",
      requestId: timestamp 
    });
  });

  // ✅ Vite يأتي أخيراً دائماً
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = 4001; // Force 4001 for alignment
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`[Server] GITA Backend successfully started on port ${PORT}`);
    console.log(`[Server] Health check available at http://localhost:${PORT}/api/health`);
    
    // Proactively initialize DB
    db.getDb().catch(e => console.error("[Server] Early DB Init failed:", e));
  });
}

startServer().catch((err) => {
  console.error("❌ فشل تشغيل السيرفر:", err);
  process.exit(1);
});