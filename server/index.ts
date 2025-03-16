import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// More flexible CORS configuration for public access
app.use(cors({
  // Allow requests from any origin for a public application
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add security headers - balanced for public access
app.use((req, res, next) => {
  // Core security headers that don't restrict access
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Set Permissions-Policy for clipboard access
  res.setHeader('Permissions-Policy', 'clipboard-write=*, clipboard-read=*');
  
  // More permissive headers for broader access
  // Remove overly restrictive COOP/COEP headers that might block legitimate access
  
  next();
});

// Simple request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = createServer(app);
  registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  app.use(express.static(path.join(__dirname, 'public')));

  const PORT = parseInt(process.env.PORT || "5000", 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running on port ${PORT}`);
  });
})();