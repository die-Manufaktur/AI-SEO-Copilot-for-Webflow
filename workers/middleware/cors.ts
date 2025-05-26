import { MiddlewareHandler } from 'hono';
import { cors as honoCors } from 'hono/cors';

/**
 * Configurable CORS middleware for the SEO Analyzer API
 * Uses environment variables for configuration when available
 */
export function corsMiddleware(options?: {
  allowedOrigins?: string[];
}): MiddlewareHandler {
  return async (c, next) => {
    // Get environment variables or use defaults
    const envOrigins = c.env?.CORS_ALLOWED_ORIGINS ? 
      c.env.CORS_ALLOWED_ORIGINS.split(',') : 
      [];
    
    // Combine with provided origins
    const allowedOrigins = [...(options?.allowedOrigins || []), ...envOrigins];
    
    // Default origins if none provided
    const defaultOrigins = ['https://webflow.com'];
    
    // Detect development environment through env var
    const isDevelopment = c.env?.NODE_ENV === 'development' || 
                         !c.env?.NODE_ENV ||
                         c.env?.NODE_ENV === '' ||
                         (typeof self !== 'undefined' && 
                          self.location?.hostname === 'localhost');
    
    // Development origins for localhost testing
    const devOrigins = isDevelopment ? [
      'http://localhost:1337',
      'http://127.0.0.1:1337',
      'http://localhost:3000',
      'http://localhost:5173'
    ] : [];
    
    // Combine all origins
    const origins = [...defaultOrigins, ...allowedOrigins, ...devOrigins];
    
    // Apply CORS middleware with environment-specific configuration
    const corsHandler = honoCors({
      origin: (origin) => {
        // No origin or in allowed list
        if (!origin || origins.includes(origin)) {
          return origin;
        }
        
        // In development, accept any localhost origin
        if (isDevelopment && (
            origin.startsWith('http://localhost:') || 
            origin.startsWith('http://127.0.0.1:')
          )) {
          return origin;
        }
        
        // Default to first allowed origin (typically webflow.com)
        return defaultOrigins[0];
      },
      allowHeaders: c.env?.CORS_ALLOWED_HEADERS?.split(',') || 
                    ['Content-Type', 'Authorization'],
      allowMethods: c.env?.CORS_ALLOWED_METHODS?.split(',') || 
                    ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      exposeHeaders: c.env?.CORS_EXPOSE_HEADERS?.split(',') || 
                     ['Content-Length', 'X-Kuma-Revision'],
      maxAge: parseInt(c.env?.CORS_MAX_AGE || '600'),
      credentials: c.env?.CORS_CREDENTIALS !== 'false', // Default to true
    });
    
    return corsHandler(c, next);
  };
}