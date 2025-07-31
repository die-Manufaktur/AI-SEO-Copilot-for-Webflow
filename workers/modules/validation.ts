import { AnalyzeSEORequest } from '../../shared/types/index';
import { validateUrl, validateKeyphrase, validateSecondaryKeywords } from '../../shared/utils/validationUtils';

/**
 * Validates that an unknown body object conforms to the AnalyzeSEORequest interface.
 * 
 * @param body - The unknown object to validate
 * @returns True if the body is a valid AnalyzeSEORequest, false otherwise
 */
export function validateAnalyzeRequest(body: unknown): body is AnalyzeSEORequest {
  if (!body || typeof body !== 'object') {
    return false;
  }
  
  const request = body as AnalyzeSEORequest;
  
  // Check required fields
  if (typeof request.keyphrase !== 'string' || request.keyphrase.length === 0) {
    return false;
  }
  
  if (typeof request.url !== 'string' || request.url.length === 0) {
    return false;
  }
  
  // Check optional fields have correct types when present
  if (request.isHomePage !== undefined && typeof request.isHomePage !== 'boolean') {
    return false;
  }
  
  // Validate advanced options if present
  if (request.advancedOptions) {
    if (typeof request.advancedOptions !== 'object') {
      return false;
    }
    
    const advancedOptions = request.advancedOptions;
    
    if (advancedOptions.pageType !== undefined && typeof advancedOptions.pageType !== 'string') {
      return false;
    }
    
    if (advancedOptions.secondaryKeywords !== undefined && typeof advancedOptions.secondaryKeywords !== 'string') {
      return false;
    }
  }
  
  // Validate webflowPageData if present
  if (request.webflowPageData) {
    if (typeof request.webflowPageData !== 'object') {
      return false;
    }
    
    const webflowData = request.webflowPageData;
    
    // Check that string fields are actually strings when present
    const stringFields = ['title', 'metaDescription', 'canonicalUrl', 'openGraphImage'] as const;
    for (const field of stringFields) {
      const value = webflowData[field];
      if (value !== undefined && typeof value !== 'string') {
        return false;
      }
    }
    
    // Check boolean fields when present
    const booleanFields = ['usesTitleAsOpenGraphTitle', 'usesDescriptionAsOpenGraphDescription'] as const;
    for (const field of booleanFields) {
      const value = webflowData[field];
      if (value !== undefined && typeof value !== 'boolean') {
        return false;
      }
    }
  }
  
  // Validate pageAssets if present
  if (request.pageAssets) {
    if (!Array.isArray(request.pageAssets)) {
      return false;
    }
    
    for (const asset of request.pageAssets) {
      if (typeof asset !== 'object' || !asset) {
        return false;
      }
      
      // Check required asset fields
      if (typeof asset.url !== 'string' || 
          typeof asset.alt !== 'string' || 
          typeof asset.type !== 'string') {
        return false;
      }
      
      // Check optional fields
      if (asset.size !== undefined && typeof asset.size !== 'number') {
        return false;
      }
      
      if (asset.mimeType !== undefined && typeof asset.mimeType !== 'string') {
        return false;
      }
    }
  }
  
  return true;
}


/**
 * Create a standardized validation error response
 */
export function createValidationError(message: string, field?: string): {
  error: string;
  field?: string;
  timestamp: string;
} {
  return {
    error: message,
    ...(field && { field }),
    timestamp: new Date().toISOString()
  };
}