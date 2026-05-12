import "dotenv/config";
console.log("🚀 [Startup] Environment Variables Loaded");
import express from "express";
import { createServer } from "http";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { registerOAuthRoutes } from "./_core/oauth";
import path from "path";
import fs from "fs";
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
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مسموح به"));
    }
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4001",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4001",
  "https://archiveitgharyan-moadzayeds-projects.vercel.app"
];

async function startServer() {
  try {
    console.log("🚀 [Startup] Initializing GITA Engine...");
    const app = express();
    const server = createServer(app);
    // ✅ CORS – custom absolute-override middleware (bypasses Railway proxy issues)
    app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST, PUT, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, x-trpc-source');

      // Instantly return 200 for preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }

      next();
    });

    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));

    // ✅ Unified UPLOAD_DIR — must match exactly what storage.ts uses
    const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_STATIC_URL;
    const UPLOAD_DIR = isRailway
      ? path.join("/tmp", "uploads")
      : path.join(process.cwd(), "uploads");

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      console.log(`📁 [Storage] Created uploads directory: ${UPLOAD_DIR}`);
    }

    // ✅ Serve uploaded files statically with full CORS headers
    app.use(
      "/uploads",
      express.static(UPLOAD_DIR, {
        setHeaders: (res) => {
          res.set("Access-Control-Allow-Origin", "*");
          res.set("Cross-Origin-Resource-Policy", "cross-origin");
          res.set("Cache-Control", "public, max-age=86400");
        },
      })
    );
    console.log(`📂 [Static] Serving uploads from: ${UPLOAD_DIR}`);

    // ✅ Direct HTTP download route — avoids tRPC overhead and CORS issues
    app.get("/api/files/download/:fileId", async (req, res) => {
      try {
        const fileId = parseInt(req.params.fileId, 10);
        if (isNaN(fileId)) {
          res.status(400).json({ error: "معرّف الملف غير صالح" });
          return;
        }
        const file = await db.getAcademicFileById(fileId);
        if (!file || file.deletedAt) {
          res.status(404).json({ error: "الملف غير موجود أو تم حذفه" });
          return;
        }

        // Resolve the actual file path
        let filePath: string;
        if (file.fileKey && !file.fileKey.startsWith("http")) {
          filePath = path.join(UPLOAD_DIR, file.fileKey);
        } else if (file.fileUrl.startsWith("/uploads/")) {
          const key = file.fileUrl.replace("/uploads/", "");
          filePath = path.join(UPLOAD_DIR, key);
        } else {
          // External URL — redirect
          res.redirect(302, file.fileUrl);
          return;
        }

        if (!fs.existsSync(filePath)) {
          console.error(`❌ [Download] File not on disk: ${filePath} (fileId=${fileId})`);
          res.status(404).json({ error: "الملف غير موجود على الخادم. يرجى التواصل مع الإدارة." });
          return;
        }

        // Increment download counter (fire-and-forget)
        db.incrementFileDownloads(fileId).catch(() => {});

        res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
        res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.sendFile(filePath);
      } catch (err) {
        console.error("❌ [Download Route Error]:", err);
        res.status(500).json({ error: "خطأ داخلي في السيرفر" });
      }
    });

    // ✅ Health check (before tRPC so it's always reachable)
    app.get("/api/health", (_req, res) =>
      res.json({ status: "ok", node: process.version, env: process.env.NODE_ENV })
    );

    console.log("📂 [Startup] Registering OAuth Routes...");
    registerOAuthRoutes(app);

    // ✅ tRPC Middleware
    console.log("🔗 [Startup] Setting up tRPC Middleware...");
    app.use(
      "/api/trpc",
      createExpressMiddleware({
        router: appRouter,
        createContext,
        onError({ error, path }) {
          if (error.code !== "UNAUTHORIZED" && error.code !== "FORBIDDEN") {
            console.error(`❌ [tRPC Error] at "${path}":`, error.message);
          }
        },
      })
    );

    // ✅ Binary File Upload Route
    app.post("/api/upload-binary", upload.single("file"), async (req, res) => {
      try {
        if (!req.file) {
          res.status(400).json({ error: "لم يتم اختيار ملف" });
          return;
        }

        const fileHash = crypto
          .createHash("md5")
          .update(req.file.buffer)
          .digest("hex");

        // Duplicate detection
        const existingFile = await db.getFileByHash(fileHash);
        if (existingFile) {
          res.status(200).json({
            key: existingFile.fileKey,
            url: existingFile.fileUrl,
            fileHash,
            size: req.file.size,
            isDuplicate: true,
          });
          return;
        }

        const fileName = req.file.originalname;
        const storageResult = await storagePut(
          fileName,
          req.file.buffer,
          req.file.mimetype
        );

        res.json({
          key: storageResult.key,
          url: storageResult.url,
          fileHash,
          size: req.file.size,
        });
      } catch (error) {
        console.error("Binary Upload Error:", error);
        res.status(500).json({ error: "فشل في معالجة الملف" });
      }
    });

    // ✅ DB Connection – Critical Path
    console.log("🗄️ [DB] Attempting to connect to database...");
    const dbInstance = await db.getDb();
    if (!dbInstance) {
      console.error(
        "❌ [FATAL] Database instance is NULL. Check DATABASE_URL in .env"
      );
      process.exit(1);
    }
    console.log("✅ [DB] Connection Verified.");

    // ✅ Static/Vite: API-only in production (frontend is on Vercel), Vite dev server in development
    if (process.env.NODE_ENV !== "production") {
      await setupVite(app, server);
    } else {
      console.log("🚀 [Production] Running as API-only backend. Static serving is handled by Vercel.");
    }

    // ✅ Bind strictly to IPv4 on port 4001
    const PORT = Number(process.env.PORT) || 4001;

    server.on("error", (error: any) => {
      console.error("🔥 [Server Error]:", error);
      if (error.code === "EADDRINUSE") {
        console.error(
          `❌ Port ${PORT} is already in use. Kill the process using it first.`
        );
        process.exit(1);
      }
    });

    server.listen({ port: PORT, host: "0.0.0.0" }, () => {
      console.log(`✨ [Ready] Backend → http://0.0.0.0:${PORT}`);
      console.log(`🔗 [API]   tRPC    → http://0.0.0.0:${PORT}/api/trpc`);
      console.log(`💊 [API]   Health  → http://0.0.0.0:${PORT}/api/health`);
    });
  } catch (err) {
    console.error("💥 [Critical Startup Failure]:", err);
    process.exit(1);
  }
}

startServer();