/**
 * useInsertion Hook
 * React hook for managing Webflow content insertion operations
 */

import { useState, useCallback, useMemo } from 'react';
import { WebflowInsertion } from '../lib/webflowInsertion';
import { WebflowDataAPI } from '../lib/webflowDataApi';
import { WebflowAuth } from '../lib/webflowAuth';
import type {
  WebflowInsertionRequest,
  WebflowInsertionResult,
  WebflowBatchInsertionRequest,
  WebflowBatchInsertionResult,
} from '../types/webflow-data-api';

const WEBFLOW_CONFIG = {
  clientId: import.meta.env.VITE_WEBFLOW_CLIENT_ID || 'test-client-id',
  redirectUri: import.meta.env.VITE_WEBFLOW_REDIRECT_URI || 'http://localhost:1337/oauth/callback',
  scope: [
    'sites:read',
    'sites:write', 
    'cms:read',
    'cms:write',
    'pages:read',
    'pages:write'
  ],
};

interface UseInsertionReturn {
  isLoading: boolean;
  error: string | null;
  applyInsertion: (request: WebflowInsertionRequest) => Promise<WebflowInsertionResult>;
  applyBatch: (request: WebflowBatchInsertionRequest) => Promise<WebflowBatchInsertionResult>;
  clearError: () => void;
}

export function useInsertion(): UseInsertionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const webflowInsertion = useMemo(() => {
    const auth = new WebflowAuth(WEBFLOW_CONFIG);
    const token = auth.getStoredToken();
    if (!token) {
      throw new Error('No Webflow token available');
    }
    const api = new WebflowDataAPI(token);
    return new WebflowInsertion(api);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const applyInsertion = useCallback(async (request: WebflowInsertionRequest): Promise<WebflowInsertionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await webflowInsertion.apply(request);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: {
          err: 'INSERTION_ERROR',
          code: 500,
          msg: errorMessage,
        },
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyBatch = useCallback(async (request: WebflowBatchInsertionRequest): Promise<WebflowBatchInsertionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await webflowInsertion.applyBatch(request);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return {
        success: false,
        results: [],
        failed: request.operations.length,
        succeeded: 0,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    applyInsertion,
    applyBatch,
    clearError,
  };
}