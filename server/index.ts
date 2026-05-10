console.log("SERVER_TRYING_TO_START");
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/jpeg", "image/png"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مسموح به"));
    }
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("[Server] Initializing GITA Engine...");
  const app = express();
  const server = createServer(app);

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  // Binary Upload Route (Restored)
  app.post("/api/upload-binary", (req, res) => {
    upload.single("file")(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      try {
        if (!req.file) return res.status(400).json({ error: "لم يتم استلام أي ملف" });
        const fileKey = `files/binary/${Date.now()}-${req.file.originalname}`;
        const result = await storagePut(fileKey, req.file.buffer, req.file.mimetype);
        const fileHash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
        res.json({ success: true, key: result.key, url: result.url, fileHash, fileName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size });
      } catch (error) {
        console.error("Binary Upload Error:", error);
        res.status(500).json({ error: "فشل رفع الملف" });
      }
    });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path }) {
        console.error(`❌ TRPC Error [${path}]:`, error.message);
      },
    })
  );

  // Global Error Handler (Restored)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ Critical Error: ${req.method} ${req.url}`);
    console.error(`Message: ${err.message}`);
    res.status(500).json({ error: "حدث خطأ في السيرفر", requestId: timestamp });
  });

  // DB Connection with Catch Block
  try {
    console.log("[DB] Attempting connection...");
    await db.getDb();
    console.log("[DB] Connection Successful.");
  } catch (err) {
    console.error("❌ CRITICAL DB FAILURE:", err);
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    console.log("[Server] Dev Mode: Vite serving via standalone port 5173 (Proxy to 4005)");
  }

  const PORT = 4005;
  server.on("error", (error: any) => {
    if (error.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is BUSY.`);
      process.exit(1);
    }
  });

  server.listen(PORT, "127.0.0.1", () => {
    console.log(`[Server] GITA_BACKEND_READY_ON_PORT_${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("❌ فشل تشغيل السيرفر:", err);
  process.exit(1);
});