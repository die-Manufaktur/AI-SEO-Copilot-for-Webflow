/**
 * Insertion Context Provider
 * GREEN Phase: Minimal implementation to make tests pass
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode, useMemo } from 'react';
import { WebflowInsertion } from '../lib/webflowInsertion';
import { WebflowDataAPI } from '../lib/webflowDataApi';
import { useAuth } from './AuthContext';
import type {
  WebflowInsertionRequest,
  WebflowInsertionResult,
  WebflowBatchInsertionRequest,
  WebflowBatchInsertionResult,
} from '../types/webflow-data-api';

export interface BatchProgress {
  current: number;
  total: number;
  percentage: number;
  currentOperation: WebflowInsertionRequest;
}

export interface InsertionHistoryEntry {
  id: string;
  timestamp: number;
  type: 'single' | 'batch';
  request: WebflowInsertionRequest | WebflowBatchInsertionRequest;
  result: WebflowInsertionResult | WebflowBatchInsertionResult;
  duration: number;
}

interface InsertionState {
  isLoading: boolean;
  error: string | null;
  progress: BatchProgress | null;
  lastResult: WebflowInsertionResult | WebflowBatchInsertionResult | null;
  pendingOperations: WebflowInsertionRequest[];
  insertionHistory: InsertionHistoryEntry[];
}

type InsertionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROGRESS'; payload: BatchProgress | null }
  | { type: 'SET_RESULT'; payload: WebflowInsertionResult | WebflowBatchInsertionResult }
  | { type: 'ADD_PENDING'; payload: WebflowInsertionRequest }
  | { type: 'REMOVE_PENDING'; payload: WebflowInsertionRequest }
  | { type: 'CLEAR_PENDING' }
  | { type: 'ADD_HISTORY'; payload: { entry: InsertionHistoryEntry; maxSize: number } }
  | { type: 'CLEAR_ERROR' };

const initialState: InsertionState = {
  isLoading: false,
  error: null,
  progress: null,
  lastResult: null,
  pendingOperations: [],
  insertionHistory: [],
};

function insertionReducer(state: InsertionState, action: InsertionAction): InsertionState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    
    case 'SET_RESULT':
      return { 
        ...state, 
        lastResult: action.payload,
        error: action.payload.success ? null : state.error, // Clear error on success
      };
    
    case 'ADD_PENDING': {
      // Prevent duplicates based on pageId/cmsItemId and type
      const exists = state.pendingOperations.some(op => 
        op.type === action.payload.type &&
        op.pageId === action.payload.pageId &&
        op.cmsItemId === action.payload.cmsItemId &&
        op.fieldId === action.payload.fieldId
      );
      
      if (exists) {
        return state;
      }
      
      return {
        ...state,
        pendingOperations: [...state.pendingOperations, action.payload],
      };
    }
    
    case 'REMOVE_PENDING': {
      return {
        ...state,
        pendingOperations: state.pendingOperations.filter(op => 
          !(op.type === action.payload.type &&
            op.pageId === action.payload.pageId &&
            op.cmsItemId === action.payload.cmsItemId &&
            op.fieldId === action.payload.fieldId)
        ),
      };
    }
    
    case 'CLEAR_PENDING':
      return { ...state, pendingOperations: [] };
    
    case 'ADD_HISTORY': {
      const newHistory = [action.payload.entry, ...state.insertionHistory];
      // Trim history if it exceeds max size
      if (newHistory.length > action.payload.maxSize) {
        newHistory.splice(action.payload.maxSize);
      }
      return { ...state, insertionHistory: newHistory };
    }
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
}

export interface InsertionContextValue {
  // State
  isLoading: boolean;
  error: string | null;
  progress: BatchProgress | null;
  lastResult: WebflowInsertionResult | WebflowBatchInsertionResult | null;
  pendingOperations: WebflowInsertionRequest[];
  insertionHistory: InsertionHistoryEntry[];
  
  // Single operations
  applyInsertion: (request: WebflowInsertionRequest) => Promise<WebflowInsertionResult>;
  
  // Batch operations
  applyBatch: (request: WebflowBatchInsertionRequest) => Promise<WebflowBatchInsertionResult>;
  rollbackBatch: (rollbackId: string) => Promise<{ success: boolean; errors?: string[] }>;
  
  // Pending operations management
  addToPending: (request: WebflowInsertionRequest) => void;
  removeFromPending: (request: WebflowInsertionRequest) => void;
  clearPending: () => void;
  
  // Utility
  clearError: () => void;
}

const InsertionContext = createContext<InsertionContextValue | null>(null);

export interface InsertionProviderProps {
  children: ReactNode;
  insertionInstance?: WebflowInsertion;
  maxHistorySize?: number;
}

export function InsertionProvider({ 
  children, 
  insertionInstance,
  maxHistorySize = 50,
}: InsertionProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(insertionReducer, initialState);
  const { token } = useAuth();

  // Create insertion instance if not provided
  const insertion = useMemo(() => {
    if (insertionInstance) {
      return insertionInstance;
    }
    
    if (!token) {
      // For Designer Extensions running within a logged-in Webflow Designer window,
      // we don't need OAuth tokens since we can use Designer Extension APIs directly
      console.log('[InsertionContext] No OAuth token available - will use Designer Extension APIs directly');
      
      // Create a minimal API that will allow WebflowInsertion to fallback to Designer APIs
      const designerApi = {
        getConfig: () => ({}),
        getAuthHeaders: () => ({}),
        // These methods won't be called when using Designer APIs
        getPage: () => Promise.reject(new Error('Data API not available - using Designer Extension APIs')),
        updatePage: () => Promise.reject(new Error('Data API not available - using Designer Extension APIs')),
        listCollections: () => Promise.reject(new Error('Data API not available - using Designer Extension APIs')),
        listCollectionItems: () => Promise.reject(new Error('Data API not available - using Designer Extension APIs')),
        updateCollectionItem: () => Promise.reject(new Error('Data API not available - using Designer Extension APIs')),
        getRateLimitInfo: () => ({ remainingRequests: 1000, resetTime: Date.now() + 3600000 }),
      } as any;

      // Return a WebflowInsertion instance that will use Designer Extension APIs
      return new WebflowInsertion(designerApi);
    }
    
    const dataApi = new WebflowDataAPI(token);
    return new WebflowInsertion(dataApi);
  }, [insertionInstance, token]);

  const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addToHistory = useCallback((
    type: 'single' | 'batch',
    request: WebflowInsertionRequest | WebflowBatchInsertionRequest,
    result: WebflowInsertionResult | WebflowBatchInsertionResult,
    duration: number
  ) => {
    const entry: InsertionHistoryEntry = {
      id: generateId(),
      timestamp: Date.now(),
      type,
      request,
      result,
      duration,
    };

    dispatch({ type: 'ADD_HISTORY', payload: { entry, maxSize: maxHistorySize } });
  }, [maxHistorySize]);

  const applyInsertion = useCallback(async (request: WebflowInsertionRequest): Promise<WebflowInsertionResult> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    const startTime = Date.now();
    
    try {
      const result = await insertion.apply(request);
      
      dispatch({ type: 'SET_RESULT', payload: result });
      
      addToHistory('single', request, result, Date.now() - startTime);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      const errorResult: WebflowInsertionResult = {
        success: false,
        error: {
          err: 'Application Error',
          code: 500,
          msg: errorMessage,
        },
      };
      
      dispatch({ type: 'SET_RESULT', payload: errorResult });
      addToHistory('single', request, errorResult, Date.now() - startTime);
      
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [insertion, addToHistory]);


  const applyBatch = useCallback(async (request: WebflowBatchInsertionRequest): Promise<WebflowBatchInsertionResult> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_PROGRESS', payload: null });
    
    const startTime = Date.now();
    
    try {
      const result = await insertion.applyBatch(request, (progress) => {
        dispatch({ type: 'SET_PROGRESS', payload: progress });
      });
      
      dispatch({ type: 'SET_RESULT', payload: result });
      
      addToHistory('batch', request, result, Date.now() - startTime);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      const errorResult: WebflowBatchInsertionResult = {
        success: false,
        results: [],
        succeeded: 0,
        failed: request.operations.length,
      };
      
      dispatch({ type: 'SET_RESULT', payload: errorResult });
      addToHistory('batch', request, errorResult, Date.now() - startTime);
      
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_PROGRESS', payload: null });
    }
  }, [insertion, addToHistory]);

  const rollbackBatch = useCallback(async (rollbackId: string): Promise<{ success: boolean; errors?: string[] }> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const result = await insertion.rollback(rollbackId);
      
      if (!result.success && result.errors) {
        dispatch({ type: 'SET_ERROR', payload: result.errors.join(', ') });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Rollback failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [insertion]);

  const addToPending = useCallback((request: WebflowInsertionRequest) => {
    dispatch({ type: 'ADD_PENDING', payload: request });
  }, []);

  const removeFromPending = useCallback((request: WebflowInsertionRequest) => {
    dispatch({ type: 'REMOVE_PENDING', payload: request });
  }, []);

  const clearPending = useCallback(() => {
    dispatch({ type: 'CLEAR_PENDING' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue: InsertionContextValue = {
    // State
    isLoading: state.isLoading,
    error: state.error,
    progress: state.progress,
    lastResult: state.lastResult,
    pendingOperations: state.pendingOperations,
    insertionHistory: state.insertionHistory,
    
    // Operations
    applyInsertion,
    applyBatch,
    rollbackBatch,
    
    // Pending management
    addToPending,
    removeFromPending,
    clearPending,
    
    // Utility
    clearError,
  };

  return (
    <InsertionContext.Provider value={contextValue}>
      {children}
    </InsertionContext.Provider>
  );
}

export function useInsertion(): InsertionContextValue {
  const context = useContext(InsertionContext);
  
  if (!context) {
    throw new Error('useInsertion must be used within an InsertionProvider');
  }
  
  return context;
}