import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  // ✅ لا تجعل SPA fallback يلتقط أي مسار API
  app.use("*", async (req, res, next) => {
    if (req.originalUrl.startsWith("/api/")) return next();

    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(__dirname, "..", "..", "client", "index.html");

      if (!fs.existsSync(clientTemplate)) {
        throw new Error(`تعذر العثور على ملف index.html في المسار: ${clientTemplate}`);
      }

      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${Math.random().toString(36).substring(7)}"`
      );

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    console.error(`❌ خطأ: لم يتم العثور على مجلد البناء: ${distPath}. نفّذ npm run build أولاً.`);
  }

  app.use(express.static(distPath));

  app.use("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api/")) return next();
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}