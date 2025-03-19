import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";
import cors from "cors";
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Use process.cwd() for consistent directory resolution in all environments
const ROOT_DIR = process.cwd();

const app = express();

// More flexible CORS configuration for public access
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'clipboard-write=*, clipboard-read=*');
  next();
});

// Simple request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Register API routes FIRST - before static serving
// This ensures API routes work in both dev and production
registerRoutes(app);

(async () => {
  const server = createServer(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    // Important: in production, serve static files AFTER registering API routes
    serveStatic(app);
  }

  // Serve from the public directory for the bundled app
  app.use(express.static(path.join(ROOT_DIR, 'public')));

  // Fall back to index.html for any unmatched routes (important for SPA)
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) return;
    
    res.sendFile(path.join(ROOT_DIR, 'public', 'index.html'));
  });

  const PORT = parseInt(process.env.PORT || "5000", 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running on port ${PORT}`);
  });
})();