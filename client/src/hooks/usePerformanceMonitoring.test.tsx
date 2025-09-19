import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { 
  usePerformanceMonitoring, 
  useRenderPerformance, 
  useApiPerformance, 
  useInteractionPerformance,
  withPerformanceTracking,
  type UsePerformanceMonitoringOptions 
} from './usePerformanceMonitoring';

// Mock the performance monitor service
vi.mock('../services/performanceMonitor', () => ({
  performanceMonitor: {
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    getMetrics: vi.fn(() => ({
      apiResponseTimes: new Map(),
      apiErrorRates: new Map(),
      rateLimitHits: 0,
      renderTimes: new Map(),
      componentMountTimes: new Map(),
      timeToInteractive: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      operationSuccessRates: new Map(),
      userEngagementMetrics: {
        sessionsPerUser: 0,
        averageSessionDuration: 0,
        operationsPerSession: 0,
      },
    })),
    getAlerts: vi.fn(() => []),
    getOptimizationSuggestions: vi.fn(() => []),
    trackApiCall: vi.fn(),
    trackComponentRender: vi.fn(),
    clearAlerts: vi.fn(),
    exportMetrics: vi.fn(() => '{}'),
  }
}));

describe('usePerformanceMonitoring Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('usePerformanceMonitoring', () => {
    it('should provide initial state with monitoring disabled', () => {
      const { result } = renderHook(() => usePerformanceMonitoring());

      expect(result.current.isMonitoring).toBe(false);
      expect(result.current.metrics).toBeNull();
      expect(result.current.alerts).toEqual([]);
      expect(result.current.suggestions).toEqual([]);
      expect(typeof result.current.startMonitoring).toBe('function');
      expect(typeof result.current.stopMonitoring).toBe('function');
      expect(typeof result.current.trackApiCall).toBe('function');
      expect(typeof result.current.trackRender).toBe('function');
      expect(typeof result.current.clearAlerts).toBe('function');
      expect(typeof result.current.exportData).toBe('function');
    });

    it('should start monitoring when startMonitoring is called', () => {
      const { result } = renderHook(() => usePerformanceMonitoring());
      const { performanceMonitor } = require('../services/performanceMonitor');

      act(() => {
        result.current.startMonitoring();
      });

      expect(result.current.isMonitoring).toBe(true);
      expect(performanceMonitor.startMonitoring).toHaveBeenCalledTimes(1);
    });

    it('should stop monitoring when stopMonitoring is called', () => {
      const { result } = renderHook(() => usePerformanceMonitoring());
      const { performanceMonitor } = require('../services/performanceMonitor');

      act(() => {
        result.current.startMonitoring();
        result.current.stopMonitoring();
      });

      expect(result.current.isMonitoring).toBe(false);
      expect(performanceMonitor.stopMonitoring).toHaveBeenCalledTimes(1);
    });

    it('should track API calls when enabled', () => {
      const { result } = renderHook(() => usePerformanceMonitoring({ trackApiCalls: true }));
      const { performanceMonitor } = require('../services/performanceMonitor');

      act(() => {
        result.current.trackApiCall('/api/test', 100, true);
      });

      expect(performanceMonitor.trackApiCall).toHaveBeenCalledWith('/api/test', 100, true);
    });

    it('should not track API calls when disabled', () => {
      const { result } = renderHook(() => usePerformanceMonitoring({ trackApiCalls: false }));
      const { performanceMonitor } = require('../services/performanceMonitor');

      act(() => {
        result.current.trackApiCall('/api/test', 100, true);
      });

      expect(performanceMonitor.trackApiCall).not.toHaveBeenCalled();
    });

    it('should track component renders when enabled', () => {
      const { result } = renderHook(() => usePerformanceMonitoring({ trackComponentRenders: true }));
      const { performanceMonitor } = require('../services/performanceMonitor');

      act(() => {
        result.current.trackRender('TestComponent', 50);
      });

      expect(performanceMonitor.trackComponentRender).toHaveBeenCalledWith('TestComponent', 50);
    });

    it('should update metrics periodically when monitoring', () => {
      const { result } = renderHook(() => usePerformanceMonitoring());
      const { performanceMonitor } = require('../services/performanceMonitor');

      act(() => {
        result.current.startMonitoring();
      });

      // Fast-forward time to trigger interval
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(performanceMonitor.getMetrics).toHaveBeenCalled();
      expect(performanceMonitor.getAlerts).toHaveBeenCalled();
      expect(performanceMonitor.getOptimizationSuggestions).toHaveBeenCalled();
    });

    it('should filter alerts based on threshold', () => {
      const mockAlerts = [
        { severity: 'low', type: 'test', message: 'Low alert', threshold: 100, currentValue: 150, timestamp: Date.now() },
        { severity: 'medium', type: 'test', message: 'Medium alert', threshold: 100, currentValue: 200, timestamp: Date.now() },
        { severity: 'high', type: 'test', message: 'High alert', threshold: 100, currentValue: 300, timestamp: Date.now() },
      ];

      const { performanceMonitor } = require('../services/performanceMonitor');
      performanceMonitor.getAlerts.mockReturnValue(mockAlerts);

      const { result } = renderHook(() => usePerformanceMonitoring({ alertThreshold: 'high' }));

      act(() => {
        result.current.startMonitoring();
        vi.advanceTimersByTime(5000);
      });

      // Only high severity alerts should be shown
      expect(result.current.alerts).toHaveLength(1);
      expect(result.current.alerts[0].severity).toBe('high');
    });
  });

  describe('useRenderPerformance', () => {
    it('should track render performance for a component', () => {
      const { result } = renderHook(() => useRenderPerformance('TestComponent'));
      const { performanceMonitor } = require('../services/performanceMonitor');

      expect(typeof result.current.trackRender).toBe('function');

      act(() => {
        result.current.trackRender(100);
      });

      expect(performanceMonitor.trackComponentRender).toHaveBeenCalledWith('TestComponent', 100);
    });
  });

  describe('useApiPerformance', () => {
    it('should track successful API calls', async () => {
      const { result } = renderHook(() => useApiPerformance());
      const { performanceMonitor } = require('../services/performanceMonitor');

      const mockApiCall = vi.fn().mockResolvedValue('success');

      await act(async () => {
        const response = await result.current.trackCall('/api/test', mockApiCall);
        expect(response).toBe('success');
      });

      expect(mockApiCall).toHaveBeenCalledTimes(1);
      expect(performanceMonitor.trackApiCall).toHaveBeenCalledWith(
        '/api/test',
        expect.any(Number),
        true
      );
    });

    it('should track failed API calls', async () => {
      const { result } = renderHook(() => useApiPerformance());
      const { performanceMonitor } = require('../services/performanceMonitor');

      const mockApiCall = vi.fn().mockRejectedValue(new Error('API Error'));

      await act(async () => {
        try {
          await result.current.trackCall('/api/test', mockApiCall);
        } catch (error) {
          expect((error as Error).message).toBe('API Error');
        }
      });

      expect(performanceMonitor.trackApiCall).toHaveBeenCalledWith(
        '/api/test',
        expect.any(Number),
        false
      );
    });
  });

  describe('useInteractionPerformance', () => {
    it('should track user interaction performance', async () => {
      const { result } = renderHook(() => useInteractionPerformance());
      const { performanceMonitor } = require('../services/performanceMonitor');

      const mockHandler = vi.fn();
      const trackedHandler = result.current.trackInteraction('button-click', mockHandler);

      await act(async () => {
        await trackedHandler();
      });

      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(performanceMonitor.trackComponentRender).toHaveBeenCalledWith(
        'interaction:button-click',
        expect.any(Number)
      );
    });
  });

  describe('withPerformanceTracking HOC', () => {
    it('should create a wrapped component that tracks performance', () => {
      const TestComponent = ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
      );
      TestComponent.displayName = 'TestComponent';

      const TrackedComponent = withPerformanceTracking(TestComponent);

      expect(TrackedComponent.displayName).toBe('withPerformanceTracking(TestComponent)');
    });

    it('should use custom component name when provided', () => {
      const TestComponent = () => <div>Test</div>;
      const TrackedComponent = withPerformanceTracking(TestComponent, 'CustomName');

      expect(TrackedComponent.displayName).toBe('withPerformanceTracking(CustomName)');
    });
  });
});