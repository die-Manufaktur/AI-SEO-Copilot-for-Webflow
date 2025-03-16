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
