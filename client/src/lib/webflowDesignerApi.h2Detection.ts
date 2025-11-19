/**
 * H2 Detection Module with Cache-Busting
 * Addresses stale content issue where Webflow API returns cached text instead of current content
 */

import type { H2ElementInfo } from './webflowDesignerApi';

type WebflowElement = globalThis.WebflowElement;

export class H2DetectionSystem {
  private readonly maxRetries = 3;
  private readonly baseDelay = 100; // milliseconds

  /**
   * Find all H2 elements with their current text content and metadata
   * Returns structured data for UI preview and manipulation
   */
  async findAllH2Elements(): Promise<H2ElementInfo[]> {
    // Add timeout wrapper to prevent hanging
    return Promise.race([
      this._findAllH2ElementsInternal(),
      new Promise<H2ElementInfo[]>((_, reject) => 
        setTimeout(() => reject(new Error('H2 detection timed out after 10 seconds')), 10000)
      )
    ]).catch(() => {
      // Return empty array on timeout/error to prevent blocking analysis
      return [];
    });
  }

  /**
   * Enhanced text content reading with retry logic, cache-busting, and fallback methods
   * Addresses stale content issue where Webflow API returns cached text instead of current content
   */
  private async _readH2TextContent(element: WebflowElement): Promise<string> {
    // Try cache-busting techniques first to ensure fresh content
    await this._attemptCacheInvalidation(element);
    
    // Try primary method with retry logic
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (typeof element.getText === 'function') {
          const textContent = await Promise.race([
            element.getText(),
            new Promise<string>((_, reject) => 
              setTimeout(() => reject(new Error('getText timeout')), 2000)
            )
          ]);
          
          // Success - return the text content
          if (typeof textContent === 'string') {
            // Double-check with alternative method to detect stale content
            const altText = await this._tryAlternativeTextAccess(element, { silent: true });
            
            // If alternative method returns different content, prefer the alternative
            // This catches cases where getText() returns stale cached content
            if (altText !== '[Unable to read text]' && altText !== textContent) {
              return altText;
            }
            
            return textContent;
          }
        }
      } catch (error) {
        // If this is the last attempt, try alternative methods
        if (attempt === this.maxRetries) {
          return await this._tryAlternativeTextAccess(element);
        }
        
        // Exponential backoff delay before retry
        const delay = this.baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Final fallback
    return await this._tryAlternativeTextAccess(element);
  }

  /**
   * Attempt to invalidate any potential caching in the Webflow API
   * This addresses the stale content issue reported at https://alt-text-a11y-7473f2.webflow.io/
   */
  private async _attemptCacheInvalidation(element: WebflowElement): Promise<void> {
    try {
      // Method 1: Try to refresh element state by calling multiple properties
      if (typeof element.refresh === 'function') {
        await element.refresh();
      }
      
      // Method 2: Access multiple properties to trigger potential cache refresh
      if (element.id) {
        const props = ['textContent', 'innerHTML', 'innerText'];
        for (const prop of props) {
          try {
            // Just accessing the property may trigger cache refresh
            const _ = element[prop as keyof WebflowElement];
          } catch (e) {
            // Ignore errors during cache invalidation attempts
          }
        }
      }
      
      // Method 3: Small delay to allow Webflow's internal systems to sync
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      // Cache invalidation is best-effort - don't fail if it doesn't work
    }
  }

  /**
   * Alternative text access methods when getText fails
   */
  private async _tryAlternativeTextAccess(element: WebflowElement, options: { silent?: boolean } = {}): Promise<string> {
    try {
      // Method 1: Direct textContent property access
      if (element.textContent && typeof element.textContent === 'string') {
        return element.textContent;
      }
      
      // Method 2: Try innerHTML if available and extract text
      if ('innerHTML' in element && typeof element.innerHTML === 'string') {
        // Simple HTML tag stripping (basic fallback)
        const textFromHTML = element.innerHTML.replace(/<[^>]*>/g, '').trim();
        if (textFromHTML) {
          return textFromHTML;
        }
      }
      
      // Method 3: Try to access through children if available
      if (typeof element.getChildren === 'function') {
        try {
          const children = await element.getChildren();
          if (Array.isArray(children)) {
            for (const child of children) {
              if (child && typeof child.getText === 'function') {
                const childText = await child.getText();
                if (childText && typeof childText === 'string') {
                  return childText;
                }
              }
            }
          }
        } catch (childError) {
          // Continue to next method
        }
      }
      
      // Method 4: Check element properties for text-related fields
      if ('properties' in element && element.properties) {
        const textProps = ['text', 'textContent', 'innerHTML', 'innerText'];
        for (const prop of textProps) {
          const properties = element.properties as Record<string, unknown>;
          const propValue = properties[prop];
          if (propValue && typeof propValue === 'string') {
            return propValue;
          }
        }
      }
      
    } catch (error) {
      // All alternative methods failed
    }
    
    // Final fallback with detailed error info
    return '[Unable to read text]';
  }

  private async _findAllH2ElementsInternal(): Promise<H2ElementInfo[]> {
    // Wait for API to be ready
    if (typeof window === 'undefined' || !window.webflow) {
      return [];
    }

    const allElements = await this._getAllElements();
    const h2Elements: H2ElementInfo[] = [];
    let h2Index = 0;
    
    for (const element of allElements) {
      try {
        // Check if element has getHeadingLevel method (indicates it's a heading)
        if (element && typeof element.getHeadingLevel === 'function') {
          // Add timeout for individual element calls
          const headingLevel = await Promise.race([
            element.getHeadingLevel(),
            new Promise<number>((_, reject) => 
              setTimeout(() => reject(new Error('getHeadingLevel timeout')), 2000)
            )
          ]);
          
          // Only process H2 elements (level 2)
          if (headingLevel === 2) {
            // Use enhanced text reading with retry logic and fallbacks
            const textContent = await this._readH2TextContent(element);
            
            h2Elements.push({
              element,
              id: element.id || `h2-${h2Index}`,
              text: textContent,
              index: h2Index,
            });
            
            h2Index++;
          }
        }
      } catch (error) {
        // Skip elements that fail getHeadingLevel call or timeout
        // This handles elements that don't support heading level detection
        continue;
      }
    }
    
    return h2Elements;
  }

  private async _getAllElements(): Promise<WebflowElement[]> {
    if (typeof window === 'undefined' || !window.webflow || !window.webflow.getAllElements) {
      return [];
    }

    try {
      const elements = await window.webflow.getAllElements();
      return (elements || []).filter(element => element != null);
    } catch (error) {
      return [];
    }
  }
}