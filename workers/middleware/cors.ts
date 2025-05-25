import { MiddlewareHandler } from 'hono';
import { cors as honoCors } from 'hono/cors';

/**
 * Configurable CORS middleware for the SEO Analyzer API
 */
export function corsMiddleware(options?: {
  allowedOrigins?: string[];
}) {
  return honoCors({
    origin: (origin) => {
      if (!origin) return 'https://webflow.com';
      
      const envAllowedOrigins = process.env.ALLOWED_ORIGINS || '';
      const configuredOrigins = envAllowedOrigins ? envAllowedOrigins.split(',') : [];
      const allowedOrigins = options?.allowedOrigins || configuredOrigins;
      
      if (allowedOrigins.includes(origin)) {
        return origin;
      }
      
      for (const pattern of allowedOrigins) {
        if (pattern.includes('*')) {
          const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
          const regex = new RegExp(`^${regexPattern}$`);
          if (regex.test(origin)) {
            return origin;
          }
        }
      }
      
      if (origin.endsWith('.webflow-ext.com')) {
        return origin;
      }
      
      return 'https://webflow.com';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  });
}