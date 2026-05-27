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
import * as db from "./db";
import { startAIWorker } from "./worker";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4001",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4001",
  process.env.FRONTEND_URL,
  "https://archiveitgharyan-moadzayeds-projects.vercel.app"
].filter(Boolean) as string[];

async function startServer() {
  try {
    console.log("🚀 [Startup] Initializing GITA Engine...");
    const app = express();
    const server = createServer(app);
    // ✅ Standard CORS Middleware
    app.use(cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        
        // Allow predefined origins, Vercel deployments, Railway deployments, and local LAN IPs for mobile testing
        const isAllowedOrigin = ALLOWED_ORIGINS.indexOf(origin) !== -1;
        const isVercel = origin.endsWith('.vercel.app');
        const isRailway = origin.endsWith('.railway.app');
        const isLocalLAN = origin.startsWith('http://192.168.') || origin.startsWith('http://10.');
        
        if (isAllowedOrigin || isVercel || isRailway || isLocalLAN) {
          callback(null, true);
        } else {
          console.warn(`⚠️ [CORS] Origin ${origin} blocked.`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-trpc-source'],
    }));

    // ✅ Issue 1: Fix Upload Size Limits (Increase to 50MB for large PDFs/Images)
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // ✅ Issue 2 & 3: Serve Static Files and Ensure Directory Existence
    const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_STATIC_URL;
    const UPLOAD_DIR = isRailway
      ? path.join("/tmp", "uploads")
      : path.join(process.cwd(), "uploads");

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      console.log(`📁 [Storage] Created uploads directory: ${UPLOAD_DIR}`);
    }

    app.use('/uploads', express.static(UPLOAD_DIR, {
      setHeaders: (res) => {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
        res.set("Cache-Control", "public, max-age=86400");
      },
    }));
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

        // Force download by setting headers explicitly
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        // Serve file directly from local storage
        res.download(filePath, file.fileName, (err) => {
          if (err) {
            console.error("❌ [Download Error]:", err);
            if (!res.headersSent) {
              res.status(500).json({ error: "فشل في تحميل الملف" });
            }
          }
        });
      } catch (err) {
        console.error("❌ [Download Route Error]:", err);
        res.status(500).json({ error: "خطأ داخلي في السيرفر" });
      }
    });

    // ✅ Health check (before tRPC so it's always reachable)
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      })
    });

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

    // ✅ Legacy Upload Route Disabled
    app.post("/api/upload-binary", (req, res) => {
       res.status(410).json({ error: "Use presigned upload. This endpoint is permanently disabled in production." });
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

    // Start background jobs
    startAIWorker();

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