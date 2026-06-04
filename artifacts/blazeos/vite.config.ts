import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  esbuild: {
    drop: ["debugger"],
    legalComments: "none",
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: "es2020",
    chunkSizeWarningLimit: 600,
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        manualChunks(id) {
          // ── Workspace packages (API client + generated Zod schemas) ─────
          // These live outside node_modules; give them a stable named chunk
          // so the hash only changes when the API schema changes.
          if (
            id.includes("/api-client-react/") ||
            id.includes("/api-zod/") ||
            id.includes("@workspace/api-client-react") ||
            id.includes("@workspace/api-zod")
          ) {
            return "app-api";
          }

          // ── Third-party vendor chunks ────────────────────────────────────
          // All node_modules below are split into named, long-lived chunks.
          // Their content hash changes only when the library version changes,
          // so browsers can cache them indefinitely between app deployments.
          if (!id.includes("node_modules")) return;

          // React runtime (react, react-dom, react-is, scheduler)
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/react-is/") ||
            id.includes("/scheduler/")
          ) {
            return "vendor-react";
          }

          // Data-fetching layer
          if (id.includes("@tanstack/")) {
            return "vendor-query";
          }

          // Supabase SDK (auth + storage)
          if (id.includes("@supabase/")) {
            return "vendor-supabase";
          }

          // Charting stack (recharts + d3 — intentionally large, lazy-only)
          if (
            id.includes("/recharts/") ||
            id.includes("/d3-") ||
            id.includes("/d3/") ||
            id.includes("/victory-")
          ) {
            return "vendor-charts";
          }

          // Animation
          if (id.includes("/framer-motion/")) {
            return "vendor-motion";
          }

          // Radix UI primitives
          if (id.includes("@radix-ui/")) {
            return "vendor-ui";
          }

          // Icon sets
          if (id.includes("/lucide-react/") || id.includes("/react-icons/")) {
            return "vendor-icons";
          }

          // General utilities (date-fns, clsx, wouter, react-hook-form, etc.)
          if (
            id.includes("/date-fns/") ||
            id.includes("/clsx/") ||
            id.includes("/tailwind-merge/") ||
            id.includes("/class-variance-authority/") ||
            id.includes("/cmdk/") ||
            id.includes("/sonner/") ||
            id.includes("/wouter/") ||
            id.includes("/@hookform/")
          ) {
            return "vendor-utils";
          }
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
