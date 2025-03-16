/**
 * IP address validation utility
 * Implements additional security checks beyond the ip package's isPublic
 * to prevent SSRF vulnerabilities (CVE-2023-42282)
 */

import * as ip from 'ip';
import IPCIDR from 'ip-cidr';
import { URL } from 'url';

// Define an allowlist of permitted domains 
// This should be customized based on your application's needs
let ALLOWED_DOMAINS = [
  "example.com",
  "pull-list.net",
  "*.pull-list.net",
  "www.pmds.pull-list.net",
  "pmds.pull-list.net"
];

// Determine if allowlist should be enforced (disable only in controlled environments)
const ENFORCE_ALLOWLIST = process.env.ENFORCE_DOMAIN_ALLOWLIST !== 'false';

/**
 * Add a domain to the allowlist
 * @param domain Domain to add (can include wildcards like *.example.com)
 * @returns true if added, false if already exists
 */
export function addDomainToAllowlist(domain: string): boolean {
  // Normalize to lowercase
  domain = domain.toLowerCase().trim();
  
  // Check if already in allowlist
  if (ALLOWED_DOMAINS.includes(domain)) {
    console.log(`Domain already in allowlist: ${domain}`);
    return false;
  }
  
  // Add to allowlist
  ALLOWED_DOMAINS.push(domain);
  console.log(`Added ${domain} to allowlist. Current list has ${ALLOWED_DOMAINS.length} domains.`);
  return true;
}

/**
 * Get the current list of allowed domains
 */
export function getAllowedDomains(): string[] {
  return [...ALLOWED_DOMAINS];
}

/**
 * Custom IPv4 format validation
 */
function isIPv4Format(address: string): boolean {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  if (!ipv4Regex.test(address)) return false;
  
  const octets = address.split('.').map(Number);
  return octets.every(octet => octet >= 0 && octet <= 255);
}

/**
 * Custom IPv6 format validation
 */
function isIPv6Format(address: string): boolean {
  // Basic IPv6 regex - simplified version
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(address);
}

/**
 * Validates if a URL is properly formatted and has an allowed hostname
 * @param urlString - The URL to validate
 * @returns boolean - true if the URL is valid and allowed
 */
export function isValidUrl(urlString: string): boolean {
  try {
    // Add https protocol if missing
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = 'https://' + urlString;
    } else if (/^http:\/\//i.test(urlString)) {
      // Convert http to https
      urlString = urlString.replace(/^http:/i, 'https:');
    }
    
    const url = new URL(urlString);
    
    // Ensure protocol is https ONLY (prevents http, javascript:, data: URLs)
    if (url.protocol !== 'https:') {
      console.log(`Rejected non-HTTPS URL: ${urlString}`);
      return false;
    }
    
    // Check hostname against allowlist if enforced
    if (ENFORCE_ALLOWLIST && !isAllowedDomain(url.hostname)) {
      console.warn(`Domain not in allowlist: ${url.hostname}`);
      return false;
    }
    
    // Check for actual path traversal sequences - don't use path.normalize()
    const pathname = url.pathname;
    if (pathname.includes('../') || pathname.includes('/..')) {
      console.warn(`Path traversal detected in URL path: ${pathname}`);
      return false;
    }
    
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Checks if a domain is in the allowed list
 * @param domain - The domain to check
 * @returns boolean - true if the domain is allowed
 */
export function isAllowedDomain(domain: string): boolean {
  // If allowlist enforcement is disabled, return true
  if (!ENFORCE_ALLOWLIST) return true;
  
  // If allowlist is empty, consider it disabled
  if (ALLOWED_DOMAINS.length === 0) return true;
  
  // Convert domain to lowercase for case-insensitive comparison
  domain = domain.toLowerCase();
  
  // Add verbose logging for troubleshooting
  console.log(`Checking if domain '${domain}' is in allowlist:`, JSON.stringify(ALLOWED_DOMAINS));
  
  // Check exact domain match
  if (ALLOWED_DOMAINS.includes(domain)) {
    console.log(`Domain '${domain}' found in allowlist (exact match)`);
    return true;
  }
  
  // Check subdomain match (*.example.com should match sub.example.com)
  const matchedWildcard = ALLOWED_DOMAINS.find(allowedDomain => {
    if (allowedDomain.startsWith('*.')) {
      const baseDomain = allowedDomain.substring(2);
      const matches = domain.endsWith(baseDomain) && domain.length > baseDomain.length;
      if (matches) {
        console.log(`Domain '${domain}' matches wildcard '${allowedDomain}'`);
      }
      return matches;
    }
    return false;
  });
  
  return !!matchedWildcard;
}

/**
 * Validates if an IP address is safe to use (not private, loopback, etc.)
 * with additional checks to handle edge cases missed by the ip package
 * 
 * @param address - The IP address to validate
 * @returns boolean - true if the address is safe and public, false otherwise
 */
export function validateIPAddress(address: string): boolean {
  // Guard against null/undefined input
  if (!address) return false;
  
  // Normalize the address
  let normalizedAddr: string;
  
  try {
    // Try to parse and normalize IPv4/IPv6
    if (isIPv4Format(address)) {
      // For IPv4, use toString(toBuffer()) pattern to normalize
      try {
        const buffer = ip.toBuffer(address);
        normalizedAddr = ip.toString(buffer);
      } catch (e) {
        // Fallback if ip package methods fail
        normalizedAddr = address;
      }
    } else if (isIPv6Format(address)) {
      // For IPv6, use as-is since we don't have built-in normalization
      normalizedAddr = address;
    } else {
      return false; // Invalid format
    }
  } catch (e) {
    return false; // Invalid format
  }
  
  // Check for various loopback formats
  if (normalizedAddr === '127.0.0.1' || 
      normalizedAddr.startsWith('127.') || 
      normalizedAddr === '::1' ||
      normalizedAddr.toLowerCase().includes('127.0.0.1') ||
      normalizedAddr.toLowerCase().includes('::1')) {
    return false;
  }
  
  // Additional checks for octal/hex formats and IPv6 mapped IPv4
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  if (ipv4Pattern.test(normalizedAddr)) {
    // Explicitly validate each octet
    const matches = normalizedAddr.match(ipv4Pattern);
    if (!matches) return false;
    
    const octets = matches.slice(1).map(Number);
    
    // Check for loopback (127.x.x.x)
    if (octets[0] === 127) return false;
    
    // Check for private ranges
    if ((octets[0] === 10) ||
        (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
        (octets[0] === 192 && octets[1] === 168)) {
      return false;
    }
  }
  
  // Replace ip.isPublic with our own check if necessary
  try {
    return ip.isPublic(normalizedAddr);
  } catch (e) {
    // If ip.isPublic fails, use our own private IP check
    return !isPrivateIP(normalizedAddr);
  }
}

/**
 * Validate if a URL is safe to make requests to
 * Extracts hostname and validates IP (if applicable)
 * 
 * @param url - The URL to validate
 * @returns boolean - true if the URL is safe, false otherwise
 */
export function validateUrl(url: string): boolean {
  try {
    console.log(`validateUrl - Checking URL: ${url}`);
    const urlObj = new URL(url);
    
    // Ensure HTTPS only - improved logging and case-insensitive check
    const protocol = urlObj.protocol.toLowerCase();
    console.log(`validateUrl - Protocol detected: ${protocol}`);
    
    if (protocol !== 'https:') {
      console.log(`Rejected non-HTTPS URL in validateUrl: ${url}`);
      return false;
    }
    
    const hostname = urlObj.hostname;
    console.log(`validateUrl - Hostname: ${hostname}`);
    
    // First check if domain is in the allowlist
    if (ENFORCE_ALLOWLIST && !isAllowedDomain(hostname)) {
      console.warn(`Domain not in allowlist: ${hostname}`);
      return false;
    }
    console.log(`validateUrl - Domain allowlist check passed`);
    
    // Check if hostname is an IP address - using our custom functions instead of ip.isV4Format
    if (isIPv4Format(hostname) || isIPv6Format(hostname)) {
      console.log(`validateUrl - Hostname is an IP address: ${hostname}`);
      const ipValid = validateIPAddress(hostname);
      console.log(`validateUrl - IP validation result: ${ipValid}`);
      return ipValid;
    }
    
    // If it's not an IP address, it's a domain name that passed the allowlist check
    console.log(`validateUrl - Validation successful for: ${url}`);
    return true;
  } catch (e) {
    console.error(`validateUrl - Error validating URL: ${e}`);
    return false; // Invalid URL format
  }
}

/**
 * Checks if an IP address belongs to a private network range
 */
export function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '127.0.0.0/8',
    '169.254.0.0/16'
  ];

  return privateRanges.some(range => {
    try {
      const cidr = new IPCIDR(range);
      return cidr.contains(ip);
    } catch (error) {
      console.error(`Error checking IP range ${range}:`, error);
      return false;
    }
  });
}