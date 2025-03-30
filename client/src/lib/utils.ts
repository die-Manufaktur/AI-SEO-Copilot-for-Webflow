import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract domain from URL string
 * @param url URL string (with or without protocol)
 * @returns Domain name or empty string if invalid
 */
export function extractDomainFromUrl(url: string): string {
  try {
    // Add protocol if missing
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(urlWithProtocol);
    return urlObj.hostname;
  } catch (e) {
    console.warn("Invalid URL:", url);
    return "";
  }
}

/**
 * Log level types
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  /** Whether logging is enabled (defaults to development environment) */
  enabled?: boolean;
  /** Minimum log level to display */
  minLevel?: LogLevel;
  /** Whether to allow specific loggers to bypass minLevel settings */
  allowOverrides?: boolean;
}

// Domain registration logs should be shown only once
const shownDomainRegistrations = new Set<string>();

/**
 * Logger interface
 */
export interface Logger {
  debug: (message: any, ...args: any[]) => void;
  info: (message: any, ...args: any[]) => void;
  warn: (message: any, ...args: any[]) => void;
  error: (message: any, ...args: any[]) => void;
}

/**
 * Creates a namespaced logger that only logs in development mode by default
 * @param namespace The logger namespace (usually module name)
 * @param options Logger configuration options
 * @returns Logger object with debug, info, warn, and error methods
 */
export function createLogger(namespace: string, options?: LoggerOptions): Logger {
  // Default to enabled in development mode
  const isDevelopment = process.env?.MODE === 'development' || 
                         process.env.NODE_ENV === 'development' ||
                         window.location.hostname === 'localhost';
                         
  const isEnabled = options?.enabled ?? isDevelopment;
  
  // Set default minimum log level to 'warn' to reduce noise
  // This effectively suppresses debug and info logs by default
  const defaultMinLevel = isDevelopment ? 'info' : 'warn';
  
  const logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  
  const minLevel = options?.minLevel || defaultMinLevel;
  const minLevelValue = logLevels[minLevel];

  // Special handling for domain registration logs to prevent duplication
  const isDomainLogger = namespace === 'API' || namespace === 'Home';

  const createLogMethod = (level: LogLevel) => {
    return (message: any, ...args: any[]) => {
      // Skip logging if level is below minimum level
      if (!isEnabled || logLevels[level] < minLevelValue) {
        return;
      }
      
      // Special handling for domain registration messages
      if (isDomainLogger && 
          (typeof message === 'string' && 
           (message.includes('domains') || message.includes('Domains')))) {
        
        // Create a unique key for this message to prevent duplicates
        const msgKey = `${namespace}-${message}-${JSON.stringify(args)}`;
        
        // If this exact message was already shown, skip it
        if (shownDomainRegistrations.has(msgKey)) {
          return;
        }
        
        // For domain registration successes, only show a single summary message
        if (message.includes('Successfully registered') || 
            message.includes('Domains registered successfully')) {
          
          // If we've shown any domain registration success message, skip
          if (Array.from(shownDomainRegistrations).some(key => 
              key.includes('Successfully registered') || 
              key.includes('Domains registered successfully'))) {
            return;
          }
        }
        
        // Mark this message as shown
        shownDomainRegistrations.add(msgKey);
      }

      const prefix = `[${namespace}]`;
      console[level](prefix, message, ...args);
    };
  };

  return {
    debug: createLogMethod('debug'),
    info: createLogMethod('info'),
    warn: createLogMethod('warn'),
    error: createLogMethod('error')
  };
}
