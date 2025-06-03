import { MiddlewareHandler } from 'hono';
import { cors as honoCors } from 'hono/cors';

/**
 * Configurable CORS middleware for the SEO Analyzer API
 * Uses environment variables for configuration when available
 */
export function corsMiddleware(options?: {
  allowedOrigins?: string[];
}) {
  return honoCors({
    origin: (origin) => {
      // Default for no origin (like server-to-server requests)
      if (!origin) return 'https://webflow.com';
      
      // Get allowed origins from environment variables
      const envAllowedOrigins = process.env.ALLOWED_ORIGINS || '';
      const configuredOrigins = envAllowedOrigins ? envAllowedOrigins.split(',') : [];
      const allowedOrigins = options?.allowedOrigins || configuredOrigins;

      // Check for exact match
      if (allowedOrigins.includes(origin)) {
        return origin;
      }
      
      // Check for wildcard matches (like *.webflow-ext.com)
      for (const pattern of allowedOrigins) {
        if (pattern.includes('*')) {
          // Convert wildcard pattern to regex
          const regexPattern = pattern
            .replace(/\./g, '\\.')  // Escape dots
            .replace(/\*/g, '.*');  // Convert * to regex .*
          
          const regex = new RegExp(`^${regexPattern}$`);
          
          if (regex.test(origin)) {
            return origin;
          }
        }
      }
      
      // Special case for Webflow domains (important for extensions)
      if (origin.endsWith('.webflow-ext.com') || 
          origin.endsWith('.webflow.io') ||
          origin === 'https://webflow.com') {
        return origin;
      }
      
      // During development, allow localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return origin;
      }
      
      // Default to null (block the request) if no matches
      return null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length', 'X-Content-Type-Options'],
    maxAge: 600, // 10 minutes
    credentials: true, // Allow cookies and credentials
  });
}