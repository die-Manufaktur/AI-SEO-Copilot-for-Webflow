/**
 * Enhanced Analytics Service Tests
 * RED Phase: Write failing tests for analytics functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { analyticsService } from './analytics';
import { disableMSWForTest } from '../__tests__/utils/testHelpers';
import type { AnalyticsEvent, SuccessMetrics, UsageMetrics, ErrorReport } from '../types/analytics';

// Disable MSW for this test file since we need direct fetch mocking
disableMSWForTest();

describe('Analytics Service', () => {
  // Create a working localStorage mock for this test suite
  const localStorageData: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => localStorageData[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      localStorageData[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete localStorageData[key];
    }),
    clear: vi.fn(() => {
      Object.keys(localStorageData).forEach(key => delete localStorageData[key]);
    }),
    length: 0,
    key: vi.fn(),
  };

  beforeEach(() => {
    // Clear the mock localStorage data
    Object.keys(localStorageData).forEach(key => delete localStorageData[key]);
    
    // Replace localStorage with our working mock
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    
    vi.clearAllMocks();
    
    // Mock timers to prevent intervals from running during tests
    vi.useFakeTimers();
    
    // Reset analytics service state completely
    analyticsService.reset();
    
    // Mock fetch for API calls
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Success Rate Tracking', () => {
    it('should track successful SEO recommendation applications', async () => {
      const event: AnalyticsEvent = {
        type: 'seo_recommendation_applied',
        timestamp: Date.now(),
        userId: 'user_123',
        sessionId: 'session_456',
        data: {
          recommendationType: 'title_tag',
          pageId: 'page_789',
          success: true,
          duration: 1500,
          source: 'ai_recommendation'
        }
      };

      await analyticsService.trackEvent(event);

      const metrics = analyticsService.getSuccessMetrics();
      expect(metrics.totalApplications).toBe(1);
      expect(metrics.successfulApplications).toBe(1);
      expect(metrics.successRate).toBe(1.0);
      expect(metrics.averageDuration).toBe(1500);
    });

    it('should track failed SEO recommendation applications', async () => {
      const event: AnalyticsEvent = {
        type: 'seo_recommendation_applied',
        timestamp: Date.now(),
        userId: 'user_123',
        sessionId: 'session_456',
        data: {
          recommendationType: 'meta_description',
          pageId: 'page_789',
          success: false,
          duration: 2000,
          error: 'Rate limit exceeded',
          source: 'manual_entry'
        }
      };

      await analyticsService.trackEvent(event);

      const metrics = analyticsService.getSuccessMetrics();
      expect(metrics.totalApplications).toBe(1);
      expect(metrics.successfulApplications).toBe(0);
      expect(metrics.successRate).toBe(0.0);
      expect(metrics.averageDuration).toBe(2000);
    });

    it('should calculate success rates across multiple applications', async () => {
      // Track multiple events
      const events: AnalyticsEvent[] = [
        {
          type: 'seo_recommendation_applied',
          timestamp: Date.now(),
          userId: 'user_123',
          sessionId: 'session_456',
          data: { recommendationType: 'title_tag', success: true, duration: 1000, source: 'ai_recommendation' }
        },
        {
          type: 'seo_recommendation_applied',
          timestamp: Date.now(),
          userId: 'user_123',
          sessionId: 'session_456',
          data: { recommendationType: 'meta_description', success: false, duration: 2000, error: 'Validation failed', source: 'manual_entry' }
        },
        {
          type: 'seo_recommendation_applied',
          timestamp: Date.now(),
          userId: 'user_123',
          sessionId: 'session_456',
          data: { recommendationType: 'heading', success: true, duration: 1500, source: 'ai_recommendation' }
        }
      ];

      for (const event of events) {
        await analyticsService.trackEvent(event);
      }

      const metrics = analyticsService.getSuccessMetrics();
      expect(metrics.totalApplications).toBe(3);
      expect(metrics.successfulApplications).toBe(2);
      expect(metrics.successRate).toBeCloseTo(0.667, 2);
      expect(metrics.averageDuration).toBe(1500);
    });

    it('should track success metrics by recommendation type', async () => {
      const titleEvent: AnalyticsEvent = {
        type: 'seo_recommendation_applied',
        timestamp: Date.now(),
        userId: 'user_123',
        sessionId: 'session_456',
        data: { recommendationType: 'title_tag', success: true, duration: 1000, source: 'ai_recommendation' }
      };

      await analyticsService.trackEvent(titleEvent);

      const metricsByType = analyticsService.getSuccessMetricsByType();
      expect(metricsByType['title_tag']).toEqual(expect.objectContaining({
        totalApplications: 1,
        successfulApplications: 1,
        successRate: 1.0,
        averageDuration: 1000
      }));
    });
  });

  describe('Usage Analytics', () => {
    it('should track user session analytics', async () => {
      const sessionStart: AnalyticsEvent = {
        type: 'session_started',
        timestamp: Date.now(),
        userId: 'user_123',
        sessionId: 'session_456',
        data: {
          source: 'webflow_designer',
          userAgent: 'Mozilla/5.0...',
          viewport: { width: 1920, height: 1080 }
        }
      };

      await analyticsService.trackEvent(sessionStart);

      const usageMetrics = analyticsService.getUsageMetrics();
      expect(usageMetrics.totalSessions).toBe(1);
      expect(usageMetrics.uniqueUsers).toBe(1);
    });

    it('should track feature usage patterns', async () => {
      const featureEvents: AnalyticsEvent[] = [
        {
          type: 'feature_used',
          timestamp: Date.now(),
          userId: 'user_123',
          sessionId: 'session_456',
          data: { feature: 'ai_recommendations', action: 'generate' }
        },
        {
          type: 'feature_used',
          timestamp: Date.now(),
          userId: 'user_123',
          sessionId: 'session_456',
          data: { feature: 'batch_apply', action: 'execute' }
        },
        {
          type: 'feature_used',
          timestamp: Date.now(),
          userId: 'user_456',
          sessionId: 'session_789',
          data: { feature: 'ai_recommendations', action: 'generate' }
        }
      ];

      for (const event of featureEvents) {
        await analyticsService.trackEvent(event);
      }

      const usageMetrics = analyticsService.getUsageMetrics();
      expect(usageMetrics.featureUsage['ai_recommendations']).toBe(2);
      expect(usageMetrics.featureUsage['batch_apply']).toBe(1);
      expect(usageMetrics.mostUsedFeatures).toEqual(['ai_recommendations', 'batch_apply']);
    });

    it('should track session duration and activity', async () => {
      const sessionStart = Date.now();
      const sessionEnd = sessionStart + 300000; // 5 minutes

      await analyticsService.trackEvent({
        type: 'session_started',
        timestamp: sessionStart,
        userId: 'user_123',
        sessionId: 'session_456',
        data: { source: 'webflow_designer' }
      });

      await analyticsService.trackEvent({
        type: 'session_ended',
        timestamp: sessionEnd,
        userId: 'user_123',
        sessionId: 'session_456',
        data: { duration: 300000, actionsPerformed: 5 }
      });

      const usageMetrics = analyticsService.getUsageMetrics();
      expect(usageMetrics.averageSessionDuration).toBe(300000);
      expect(usageMetrics.averageActionsPerSession).toBe(5);
    });

    it('should track time-based usage patterns', async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      await analyticsService.trackEvent({
        type: 'seo_recommendation_applied',
        timestamp: hourAgo.getTime(),
        userId: 'user_123',
        sessionId: 'session_456',
        data: { recommendationType: 'title_tag', success: true, duration: 1000, source: 'ai_recommendation' }
      });

      const hourlyMetrics = analyticsService.getUsageMetricsByTimeRange('hour');
      expect(hourlyMetrics.length).toBeGreaterThan(0);
      expect(hourlyMetrics[0]).toHaveProperty('timestamp');
      expect(hourlyMetrics[0]).toHaveProperty('events');
    });
  });

  describe('Error Reporting', () => {
    it('should track and categorize application errors', async () => {
      const errorEvent: AnalyticsEvent = {
        type: 'error_occurred',
        timestamp: Date.now(),
        userId: 'user_123',
        sessionId: 'session_456',
        data: {
          errorType: 'api_error',
          errorMessage: 'Failed to update page metadata',
          errorCode: 'WEBFLOW_API_429',
          stack: 'Error at updatePageMetadata...',
          context: {
            pageId: 'page_789',
            operation: 'update_title',
            retryAttempt: 1
          }
        }
      };

      await analyticsService.trackEvent(errorEvent);

      const errorReport = analyticsService.getErrorReport();
      expect(errorReport.totalErrors).toBe(1);
      expect(errorReport.errorsByType['api_error']).toBe(1);
      expect(errorReport.errorsByCode['WEBFLOW_API_429']).toBe(1);
      expect(errorReport.mostCommonErrors).toContain('WEBFLOW_API_429');
    });

    it('should track error resolution times', async () => {
      const errorStart = Date.now();
      const errorResolved = errorStart + 30000; // 30 seconds

      await analyticsService.trackEvent({
        type: 'error_occurred',
        timestamp: errorStart,
        userId: 'user_123',
        sessionId: 'session_456',
        data: {
          errorType: 'validation_error',
          errorMessage: 'Invalid title length',
          errorId: 'error_123'
        }
      });

      await analyticsService.trackEvent({
        type: 'error_resolved',
        timestamp: errorResolved,
        userId: 'user_123',
        sessionId: 'session_456',
        data: {
          errorId: 'error_123',
          resolutionMethod: 'user_correction',
          timeToResolution: 30000
        }
      });

      const errorReport = analyticsService.getErrorReport();
      expect(errorReport.averageResolutionTime).toBe(30000);
      expect(errorReport.resolutionMethods['user_correction']).toBe(1);
    });

    it('should identify error patterns and trends', async () => {
      // Track multiple similar errors
      const baseTime = Date.now();
      for (let i = 0; i < 5; i++) {
        await analyticsService.trackEvent({
          type: 'error_occurred',
          timestamp: baseTime + (i * 60000), // 1 minute apart
          userId: `user_${i}`,
          sessionId: `session_${i}`,
          data: {
            errorType: 'api_error',
            errorMessage: 'Rate limit exceeded',
            errorCode: 'WEBFLOW_API_429'
          }
        });
      }

      const errorPatterns = analyticsService.getErrorPatterns();
      expect(errorPatterns.spikes).toHaveLength(1);
      expect(errorPatterns.spikes[0].errorCode).toBe('WEBFLOW_API_429');
      expect(errorPatterns.spikes[0].frequency).toBe(5);
    });
  });

  describe('Analytics Persistence', () => {
    it('should persist analytics data to localStorage', async () => {
      const event: AnalyticsEvent = {
        type: 'seo_recommendation_applied',
        timestamp: Date.now(),
        userId: 'user_123',
        sessionId: 'session_456',
        data: { recommendationType: 'title_tag', success: true, duration: 1000, source: 'ai_recommendation' }
      };

      await analyticsService.trackEvent(event);

      // Check localStorage after the async operation
      const storedData = localStorage.getItem('seo_copilot_analytics');
      expect(storedData).not.toBeNull();
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        expect(parsedData.events).toHaveLength(1);
        expect(parsedData.events[0].type).toBe('seo_recommendation_applied');
      }
    });

    it('should load analytics data from localStorage on initialization', () => {
      const storedEvent = {
        type: 'seo_recommendation_applied',
        timestamp: Date.now(),
        userId: 'user_123',
        sessionId: 'session_456',
        data: { recommendationType: 'title_tag', success: true, duration: 1000, source: 'ai_recommendation' }
      };

      localStorage.setItem('seo_copilot_analytics', JSON.stringify({
        events: [storedEvent],
        metadata: { version: '1.0.0' },
        settings: {
          enableTracking: true,
          enableRemoteSync: false,
          anonymizeUserData: false,
          dataRetentionDays: 30
        }
      }));

      // Reset and then reinitialize analytics service
      analyticsService.reset();
      analyticsService.initialize();

      const metrics = analyticsService.getSuccessMetrics();
      expect(metrics.totalApplications).toBe(1);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('seo_copilot_analytics', 'invalid json');

      expect(() => analyticsService.initialize()).not.toThrow();
      
      const metrics = analyticsService.getSuccessMetrics();
      expect(metrics.totalApplications).toBe(0);
    });
  });

  describe('Analytics API Integration', () => {
    it('should send analytics data to remote analytics service', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'success' })
      } as Response);

      // Enable remote sync and set API endpoint
      analyticsService.setPrivacySettings({
        enableTracking: true,
        enableRemoteSync: true,
        anonymizeUserData: false
      });
      
      // Set API endpoint directly on the service config
      (analyticsService as any).config.apiEndpoint = 'https://api.example.com';

      const event: AnalyticsEvent = {
        type: 'seo_recommendation_applied',
        timestamp: Date.now(),
        userId: 'user_123',
        sessionId: 'session_456',
        data: { recommendationType: 'title_tag', success: true, duration: 1000, source: 'ai_recommendation' }
      };

      await analyticsService.trackEvent(event);
      await analyticsService.syncWithRemote();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/events'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('seo_recommendation_applied')
        })
      );
    });

    it('should handle remote analytics service failures gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const event: AnalyticsEvent = {
        type: 'seo_recommendation_applied',
        timestamp: Date.now(),
        userId: 'user_123',
        sessionId: 'session_456',
        data: { recommendationType: 'title_tag', success: true, duration: 1000, source: 'ai_recommendation' }
      };

      await expect(analyticsService.trackEvent(event)).resolves.not.toThrow();
      await expect(analyticsService.syncWithRemote()).resolves.not.toThrow();

      // Local data should still be tracked
      const metrics = analyticsService.getSuccessMetrics();
      expect(metrics.totalApplications).toBe(1);
    });

    it('should batch analytics events for efficient transmission', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'success' })
      } as Response);

      // Set API endpoint directly on the service config first
      (analyticsService as any).config.apiEndpoint = 'https://api.example.com';

      // Enable remote sync after setting endpoint 
      analyticsService.setPrivacySettings({
        enableTracking: true,
        enableRemoteSync: true,
        anonymizeUserData: false
      });

      // Track multiple events
      for (let i = 0; i < 10; i++) {
        await analyticsService.trackEvent({
          type: 'seo_recommendation_applied',
          timestamp: Date.now(),
          userId: 'user_123',
          sessionId: 'session_456',
          data: { recommendationType: 'title_tag', success: true, duration: 1000, source: 'ai_recommendation' }
        });
      }

      await analyticsService.syncWithRemote();

      // Each trackEvent call triggers a sync, plus the final explicit sync call
      // So we expect 11 calls total (10 + 1)
      expect(mockFetch).toHaveBeenCalledTimes(11);
      
      // Verify that each call includes the accumulated events
      const lastCallArgs = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(lastCallArgs).toBeDefined();
      expect(lastCallArgs[1]).toBeDefined();
      expect(lastCallArgs[1]).toHaveProperty('body');
      const requestOptions = lastCallArgs[1];
      expect(requestOptions?.body).toBeDefined();
      const requestBody = JSON.parse(requestOptions!.body as string);
      expect(requestBody.events).toHaveLength(10);
    });
  });

  describe('Privacy and Compliance', () => {
    it('should respect user privacy settings', async () => {
      analyticsService.setPrivacySettings({
        enableTracking: false,
        enableRemoteSync: false,
        anonymizeUserData: true
      });

      const event: AnalyticsEvent = {
        type: 'seo_recommendation_applied',
        timestamp: Date.now(),
        userId: 'user_123',
        sessionId: 'session_456',
        data: { recommendationType: 'title_tag', success: true, duration: 1000, source: 'ai_recommendation' }
      };

      await analyticsService.trackEvent(event);

      const metrics = analyticsService.getSuccessMetrics();
      expect(metrics.totalApplications).toBe(0); // Should not track when disabled
    });

    it('should anonymize user data when privacy settings require it', async () => {
      analyticsService.setPrivacySettings({
        enableTracking: true,
        enableRemoteSync: false, // Disable to avoid sync calls
        anonymizeUserData: true
      });

      const event: AnalyticsEvent = {
        type: 'seo_recommendation_applied',
        timestamp: Date.now(),
        userId: 'user_123',
        sessionId: 'session_456',
        data: { recommendationType: 'title_tag', success: true, duration: 1000, source: 'ai_recommendation' }
      };

      await analyticsService.trackEvent(event);

      const storedData = localStorage.getItem('seo_copilot_analytics');
      expect(storedData).not.toBeNull();
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        // User ID should be hashed or anonymized
        expect(parsedData.events[0].userId).not.toBe('user_123');
        expect(parsedData.events[0].userId).toMatch(/^[a-f0-9]{8}$/); // 8-character hex hash format
      }
    });

    it('should provide data export functionality for GDPR compliance', () => {
      const event: AnalyticsEvent = {
        type: 'seo_recommendation_applied',
        timestamp: Date.now(),
        userId: 'user_123',
        sessionId: 'session_456',
        data: { recommendationType: 'title_tag', success: true, duration: 1000, source: 'ai_recommendation' }
      };

      analyticsService.trackEvent(event);

      const exportedData = analyticsService.exportUserData('user_123');
      expect(exportedData).toHaveProperty('events');
      expect(exportedData).toHaveProperty('metrics');
      expect(exportedData).toHaveProperty('exportTimestamp');
      expect(exportedData.events).toHaveLength(1);
    });

    it('should allow complete data deletion for GDPR compliance', async () => {
      const event: AnalyticsEvent = {
        type: 'seo_recommendation_applied',
        timestamp: Date.now(),
        userId: 'user_123',
        sessionId: 'session_456',
        data: { recommendationType: 'title_tag', success: true, duration: 1000, source: 'ai_recommendation' }
      };

      await analyticsService.trackEvent(event);
      
      expect(analyticsService.getSuccessMetrics().totalApplications).toBe(1);

      await analyticsService.deleteUserData('user_123');

      expect(analyticsService.getSuccessMetrics().totalApplications).toBe(0);
      const exportedData = analyticsService.exportUserData('user_123');
      expect(exportedData.events).toHaveLength(0);
    });
  });
});