/**
 * React Hook for Performance Monitoring
 * Provides easy integration with React components
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { performanceMonitor, type PerformanceMetrics, type PerformanceAlert, type OptimizationSuggestion } from '../services/performanceMonitor';

export interface UsePerformanceMonitoringOptions {
  trackApiCalls?: boolean;
  trackComponentRenders?: boolean;
  trackUserInteractions?: boolean;
  alertThreshold?: 'low' | 'medium' | 'high';
}

export interface PerformanceHookReturn {
  metrics: PerformanceMetrics | null;
  alerts: PerformanceAlert[];
  suggestions: OptimizationSuggestion[];
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  trackApiCall: (endpoint: string, duration: number, success: boolean) => void;
  trackRender: (componentName: string, duration: number) => void;
  clearAlerts: () => void;
  exportData: () => string;
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitoring(
  options: UsePerformanceMonitoringOptions = {}
): PerformanceHookReturn {
  const {
    trackApiCalls = true,
    trackComponentRenders = true,
    trackUserInteractions = true,
    alertThreshold = 'medium',
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const updateInterval = useRef<number | undefined>(undefined);
  const componentName = useRef<string>('');

  // Update metrics periodically
  useEffect(() => {
    if (isMonitoring) {
      updateInterval.current = window.setInterval(() => {
        setMetrics(performanceMonitor.getMetrics());
        const allAlerts = performanceMonitor.getAlerts() || [];
        const filteredAlerts = allAlerts.filter(alert => {
          if (!alert || !alert.severity) return false;
          if (alertThreshold === 'low') return true;
          if (alertThreshold === 'medium') return alert.severity !== 'low';
          if (alertThreshold === 'high') return alert.severity === 'high' || alert.severity === 'critical';
          return true;
        });
        setAlerts(filteredAlerts);
        setSuggestions(performanceMonitor.getOptimizationSuggestions() || []);
      }, 5000); // Update every 5 seconds
    }

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [isMonitoring, alertThreshold]);

  const startMonitoring = useCallback(() => {
    performanceMonitor.startMonitoring();
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    performanceMonitor.stopMonitoring();
    setIsMonitoring(false);
  }, []);

  const trackApiCall = useCallback((endpoint: string, duration: number, success: boolean) => {
    if (trackApiCalls) {
      performanceMonitor.trackApiCall(endpoint, duration, success);
    }
  }, [trackApiCalls]);

  const trackRender = useCallback((componentName: string, duration: number) => {
    if (trackComponentRenders) {
      performanceMonitor.trackComponentRender(componentName, duration);
    }
  }, [trackComponentRenders]);

  const clearAlerts = useCallback(() => {
    performanceMonitor.clearAlerts();
    setAlerts([]);
  }, []);

  const exportData = useCallback(() => {
    return performanceMonitor.exportMetrics();
  }, []);

  return {
    metrics,
    alerts,
    suggestions,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    trackApiCall,
    trackRender,
    clearAlerts,
    exportData,
  };
}

/**
 * Hook for tracking component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderStartTime = useRef<number | undefined>(undefined);
  const { trackRender } = usePerformanceMonitoring();

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const duration = performance.now() - renderStartTime.current;
      trackRender(componentName, duration);
    }
  });

  return {
    trackRender: (duration?: number) => {
      const actualDuration = duration ?? (renderStartTime.current ? performance.now() - renderStartTime.current : 0);
      trackRender(componentName, actualDuration);
    }
  };
}

/**
 * Hook for tracking API call performance
 */
export function useApiPerformance() {
  const { trackApiCall } = usePerformanceMonitoring();

  const trackCall = useCallback(async <T,>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    let success = false;
    
    try {
      const result = await apiCall();
      success = true;
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      trackApiCall(endpoint, duration, success);
    }
  }, [trackApiCall]);

  return { trackCall };
}

/**
 * Hook for tracking user interaction performance
 */
export function useInteractionPerformance() {
  const { trackRender } = usePerformanceMonitoring();

  const trackInteraction = useCallback((
    interactionName: string,
    handler: () => void | Promise<void>
  ) => {
    return async () => {
      const startTime = performance.now();
      
      try {
        await handler();
      } finally {
        const duration = performance.now() - startTime;
        trackRender(`interaction:${interactionName}`, duration);
      }
    };
  }, [trackRender]);

  return { trackInteraction };
}

/**
 * HOC for automatic component performance tracking
 */
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const TrackedComponent = (props: P) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    useRenderPerformance(name);
    
    return <WrappedComponent {...props} />;
  };

  TrackedComponent.displayName = `withPerformanceTracking(${
    componentName || WrappedComponent.displayName || WrappedComponent.name
  })`;

  return TrackedComponent;
}