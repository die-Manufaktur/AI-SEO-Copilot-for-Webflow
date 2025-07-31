import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
// Re-export URL utilities for backward compatibility
export { extractDomainFromUrl, extractTextAfterColon } from '../../../shared/utils/urlUtils';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


/**
 * Log level types
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

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

// Determine if we're in production
const isProduction = () => {
  return process.env.NODE_ENV === 'production' || 
         import.meta.env?.MODE === 'production' ||
         import.meta.env?.PROD === true ||
         !import.meta.env?.DEV;
};

export const createLogger = (namespace: string) => {
  return {
    debug: (...args: any[]) => {
      if (!isProduction()) {
        console.debug(`${namespace}:`, ...args);
      }
    },
    info: (...args: any[]) => {
      if (!isProduction()) {
        console.info(`${namespace}:`, ...args);
      }
    },
    warn: (...args: any[]) => {
      console.warn(`${namespace}:`, ...args);
    },
    error: (...args: any[]) => {
      console.error(`${namespace}:`, ...args);
    }
  };
}

// Removed duplicate calculateSEOScore function - use shared version from '../../../shared/utils/seoUtils'
