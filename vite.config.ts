import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename).replace(/\\/g, "/");

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({ filename: "stats.json", template: "raw-data", gzipSize: true, brotliSize: true }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.png', 'social-preview.png'],
      manifest: {
        name: 'GITA - IT Archive',
        short_name: 'GITA',
        description: 'المنصة الرسمية لطلاب كلية تقنية المعلومات لتبادل الملفات الأكاديمية.',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3000000, // رفع الحد لـ 3MB لدعم ملفات الـ 3D
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    target: 'esnext', // تحسين أداء جافا سكريبت الحديثة
    minify: 'esbuild', // التأكد من استخدام esbuild للضغط والسرعة
    chunkSizeWarningLimit: 2000, // رفع الحد لـ 2MB لضمان بناء نظيف تماماً في Vercel
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'wouter'],
          'ui-vendor': [
            '@radix-ui/react-select', 
            '@radix-ui/react-dialog', 
            '@radix-ui/react-popover'
          ],
          'animation': ['framer-motion'],
          'charts': ['recharts'],
          'query-trpc': ['@tanstack/react-query', '@trpc/client', '@trpc/react-query']
        }
      }
    }
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "client/src") },
      { find: "@shared", replacement: path.resolve(__dirname, "shared") }
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4001",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:4001",
        changeOrigin: true,
      },
    },
  },
});