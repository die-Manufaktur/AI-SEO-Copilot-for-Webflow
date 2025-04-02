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
export function createLogger(prefix: string) {
  const logStyles = {
    debug: 'color: #7f8c8d',
    info: 'color: #2980b9',
    warn: 'color: #f39c12',
    error: 'color: #c0392b',
  };

  // In production, return no-op functions for all log levels
  if (process.env.NODE_ENV === 'production') {
    return {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {}
    };
  }
  
  // In development, maintain existing logging behavior
  return {
    debug: (...args: any[]) => {
      console.log(`%c${prefix}`, logStyles.debug, ...args);
    },
    info: (...args: any[]) => {
      console.log(`%c${prefix}`, logStyles.info, ...args);
    },
    warn: (...args: any[]) => {
      console.warn(`%c${prefix}`, logStyles.warn, ...args);
    },
    error: (...args: any[]) => {
      console.error(`%c${prefix}`, logStyles.error, ...args);
    }
  };
}
