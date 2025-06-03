import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract domain from URL string
 * @param url URL string (with or without protocol)
 * @returns Domain name or empty string if invalid
 */
export function extractDomainFromUrl(url: string): string {
  try {
    // Add protocol if missing
    const urlWithProtocol = url.startsWith("http")
      ? url
      : `https://${url}`;
    const urlObj = new URL(urlWithProtocol);
    return urlObj.hostname;
  } catch (e) {
    console.warn("Invalid URL:", url);
    return "";
  }
}

/**
 * Extracts text after the first colon in a string.
 * Returns the original string if no colon is found.
 * @param text The input string.
 * @returns The text after the first colon, trimmed, or the original string.
 */
export function extractTextAfterColon(text: string | undefined | null): string {
  if (!text) {
    return "";
  }
  const colonIndex = text.indexOf(":");
  if (colonIndex === -1) {
    return text.trim(); // Return trimmed original if no colon
  }
  return text.substring(colonIndex + 1).trim();
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
         window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
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

/**
 * Calculate SEO Score based on checks
 * @param checks Array of checks with passed status and priority
 * @returns Calculated SEO score (0-100)
 */
export function calculateSEOScore(checks: Array<{ passed: boolean; priority: 'high' | 'medium' | 'low' }>): number {
  if (checks.length === 0) return 0;
  
  const weights = { high: 3, medium: 2, low: 1 };
  let totalWeight = 0;
  let passedWeight = 0;
  
  checks.forEach(check => {
    const weight = weights[check.priority];
    totalWeight += weight;
    if (check.passed) {
      passedWeight += weight;
    }
  });
  
  return Math.round((passedWeight / totalWeight) * 100);
}
