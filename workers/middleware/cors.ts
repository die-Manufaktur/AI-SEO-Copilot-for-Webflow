import { MiddlewareHandler } from 'hono';
import { cors as honoCors } from 'hono/cors';

/**
 * Configurable CORS middleware for the SEO Analyzer API
 * Supports both development and production environments
 */
export function corsMiddleware(options?: {
  allowedOrigins?: string[];
}): MiddlewareHandler {
  return honoCors({
    origin: (origin, c) => {
      if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
        return origin;
      }
      
      if (options?.allowedOrigins?.includes(origin)) {
        return origin;
      }
      
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      return allowedOrigins.includes(origin) ? origin : null;
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true
  });
}