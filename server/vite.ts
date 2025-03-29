import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";

// Use process.cwd() instead of fileURLToPath
const ROOT_DIR = process.cwd();
const CLIENT_DIR = path.join(ROOT_DIR, "client");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

const viteLogger = createLogger();

export function log(...args: any[]) {
  console.log("\x1b[36m[server]\x1b[0m", ...args);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    // Define config inline instead of importing it
    plugins: [],
    root: CLIENT_DIR,
    // Remove the reference to viteConfig
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "spa",
    build: {
      outDir: '../public',
      emptyOutDir: true,
    },
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        if (
          msg.includes("[TypeScript] Found 0 errors. Watching for file changes")
        ) {
          log("no errors found", "tsc");
          return;
        }

        if (msg.includes("[TypeScript] ")) {
          const [errors, summary] = msg.split("[TypeScript] ", 2);
          log(`${summary} ${errors}\u001b[0m`, "tsc");
          return;
        } else {
          viteLogger.error(msg, options);
          process.exit(1);
        }
      },
    },
  });

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });

  app.use(limiter);
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        CLIENT_DIR,
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      const template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  log("Vite development server set up");
  return vite;
}

export function serveStatic(app: Express) {
  app.use(express.static(PUBLIC_DIR));

  // fall through to index.html if the file doesn't exist
  const staticLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });

  app.use("*", staticLimiter, (_req, res) => {
    res.sendFile(path.resolve(PUBLIC_DIR, "index.html"));
  });

  log("Static files being served from:", PUBLIC_DIR);
}
