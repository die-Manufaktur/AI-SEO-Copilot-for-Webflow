/**
 * Enhanced Analytics Service
 * GREEN Phase: Implementation to make TDD tests pass
 */

import type {
  AnalyticsEvent,
  AnalyticsConfig,
  SuccessMetrics,
  SuccessMetricsByType,
  UsageMetrics,
  TimeRangeMetrics,
  ErrorReport,
  ErrorPatterns,
  ErrorPattern,
  PrivacySettings,
  UserDataExport,
  AnalyticsStorageData
} from '../types/analytics';

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private config: AnalyticsConfig;
  private privacySettings: PrivacySettings;
  private storageKey = 'seo_copilot_analytics';

  constructor() {
    this.config = {
      apiEndpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT || '',
      batchSize: 50,
      syncInterval: 300000, // 5 minutes
      maxStorageEvents: 1000,
      privacySettings: {
        enableTracking: true,
        enableRemoteSync: false,
        anonymizeUserData: false,
        dataRetentionDays: 30
      }
    };

    this.privacySettings = this.config.privacySettings;
    this.initialize();
  }

  /**
   * Reset analytics service state (for testing)
   */
  reset(): void {
    this.events = [];
    this.privacySettings = {
      enableTracking: true,
      enableRemoteSync: false,
      anonymizeUserData: false,
      dataRetentionDays: 30
    };
  }

  /**
   * Initialize analytics service and load stored data
   */
  initialize(): void {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (storedData) {
        const parsed: AnalyticsStorageData = JSON.parse(storedData);
        this.events = parsed.events || [];
        this.privacySettings = { ...this.privacySettings, ...parsed.settings };
      }
    } catch (error) {
      console.warn('Failed to load analytics data from storage:', error);
      this.events = [];
    }

    // Clean up old events
    this.cleanupOldEvents();

    // Start periodic sync if enabled
    if (this.privacySettings.enableRemoteSync && this.config.apiEndpoint) {
      setInterval(() => this.syncWithRemote(), this.config.syncInterval);
    }
  }

  /**
   * Track an analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.privacySettings.enableTracking) {
      return;
    }

    // Anonymize user data if required
    const processedEvent = this.privacySettings.anonymizeUserData
      ? this.anonymizeEvent(event)
      : event;

    this.events.push(processedEvent);

    // Persist to storage
    await this.persistToStorage();

    // Sync with remote if enabled and configured
    if (this.privacySettings.enableRemoteSync && this.config.apiEndpoint) {
      try {
        await this.syncWithRemote();
      } catch (error) {
        console.warn('Failed to sync with remote analytics:', error);
      }
    }
  }

  /**
   * Get success metrics for SEO recommendation applications
   */
  getSuccessMetrics(): SuccessMetrics {
    const seoEvents = this.events.filter(event => 
      event.type === 'seo_recommendation_applied'
    );

    const totalApplications = seoEvents.length;
    const successfulApplications = seoEvents.filter(event => 
      event.data.success === true
    ).length;

    const durations = seoEvents
      .filter(event => typeof event.data.duration === 'number')
      .map(event => event.data.duration);

    const averageDuration = durations.length > 0
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      : 0;

    return {
      totalApplications,
      successfulApplications,
      successRate: totalApplications > 0 ? successfulApplications / totalApplications : 0,
      averageDuration,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get success metrics broken down by recommendation type
   */
  getSuccessMetricsByType(): SuccessMetricsByType {
    const seoEvents = this.events.filter(event => 
      event.type === 'seo_recommendation_applied'
    );

    const metricsByType: SuccessMetricsByType = {};

    seoEvents.forEach(event => {
      const type = event.data.recommendationType;
      if (!type) return;

      if (!metricsByType[type]) {
        metricsByType[type] = {
          totalApplications: 0,
          successfulApplications: 0,
          successRate: 0,
          averageDuration: 0,
          lastUpdated: Date.now()
        };
      }

      metricsByType[type].totalApplications++;
      if (event.data.success) {
        metricsByType[type].successfulApplications++;
      }
    });

    // Calculate success rates and average durations
    Object.keys(metricsByType).forEach(type => {
      const metrics = metricsByType[type];
      metrics.successRate = metrics.successfulApplications / metrics.totalApplications;

      const typeEvents = seoEvents.filter(event => 
        event.data.recommendationType === type && 
        typeof event.data.duration === 'number'
      );

      if (typeEvents.length > 0) {
        const totalDuration = typeEvents.reduce((sum, event) => sum + event.data.duration, 0);
        metrics.averageDuration = totalDuration / typeEvents.length;
      }
    });

    return metricsByType;
  }

  /**
   * Get usage analytics metrics
   */
  getUsageMetrics(): UsageMetrics {
    const sessions = new Set(this.events.map(event => event.sessionId));
    const users = new Set(this.events.map(event => event.userId));

    // Calculate session durations
    const sessionDurations: number[] = [];
    const sessionActions: Record<string, number> = {};

    sessions.forEach(sessionId => {
      const sessionEvents = this.events.filter(event => event.sessionId === sessionId);
      const startEvent = sessionEvents.find(event => event.type === 'session_started');
      const endEvent = sessionEvents.find(event => event.type === 'session_ended');

      if (startEvent && endEvent) {
        sessionDurations.push(endEvent.data.duration || 0);
        sessionActions[sessionId] = endEvent.data.actionsPerformed || sessionEvents.length;
      } else {
        sessionActions[sessionId] = sessionEvents.length;
      }
    });

    // Calculate feature usage
    const featureUsage: Record<string, number> = {};
    this.events
      .filter(event => event.type === 'feature_used')
      .forEach(event => {
        const feature = event.data.feature;
        featureUsage[feature] = (featureUsage[feature] || 0) + 1;
      });

    const mostUsedFeatures = Object.entries(featureUsage)
      .sort(([, a], [, b]) => b - a)
      .map(([feature]) => feature);

    // Calculate peak usage hours
    const hourlyUsage: Record<number, number> = {};
    this.events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourlyUsage[hour] = (hourlyUsage[hour] || 0) + 1;
    });

    const peakUsageHours = Object.entries(hourlyUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    return {
      totalSessions: sessions.size,
      uniqueUsers: users.size,
      averageSessionDuration: sessionDurations.length > 0 
        ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
        : 0,
      averageActionsPerSession: Object.keys(sessionActions).length > 0
        ? Object.values(sessionActions).reduce((sum, actions) => sum + actions, 0) / Object.keys(sessionActions).length
        : 0,
      featureUsage,
      mostUsedFeatures,
      peakUsageHours,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get usage metrics for a specific time range
   */
  getUsageMetricsByTimeRange(range: 'hour' | 'day' | 'week' | 'month'): TimeRangeMetrics[] {
    const now = Date.now();
    const intervals: Record<string, number> = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };

    const interval = intervals[range];
    const periods = range === 'hour' ? 24 : range === 'day' ? 7 : range === 'week' ? 4 : 12;

    const metrics: TimeRangeMetrics[] = [];

    for (let i = periods - 1; i >= 0; i--) {
      const periodStart = now - (interval * (i + 1));
      const periodEnd = now - (interval * i);

      const periodEvents = this.events.filter(event => 
        event.timestamp >= periodStart && event.timestamp < periodEnd
      );

      const seoEvents = periodEvents.filter(event => 
        event.type === 'seo_recommendation_applied'
      );

      const successfulEvents = seoEvents.filter(event => event.data.success);
      const errorEvents = periodEvents.filter(event => event.type === 'error_occurred');
      const uniqueUsers = new Set(periodEvents.map(event => event.userId)).size;

      metrics.push({
        timestamp: periodStart,
        events: periodEvents.length,
        successRate: seoEvents.length > 0 ? successfulEvents.length / seoEvents.length : 0,
        errors: errorEvents.length,
        uniqueUsers
      });
    }

    return metrics;
  }

  /**
   * Get comprehensive error report
   */
  getErrorReport(): ErrorReport {
    const errorEvents = this.events.filter(event => event.type === 'error_occurred');
    const resolutionEvents = this.events.filter(event => event.type === 'error_resolved');

    const errorsByType: Record<string, number> = {};
    const errorsByCode: Record<string, number> = {};
    const resolutionMethods: Record<string, number> = {};

    errorEvents.forEach(event => {
      const errorType = event.data.errorType;
      const errorCode = event.data.errorCode;

      if (errorType) {
        errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
      }

      if (errorCode) {
        errorsByCode[errorCode] = (errorsByCode[errorCode] || 0) + 1;
      }
    });

    resolutionEvents.forEach(event => {
      const method = event.data.resolutionMethod;
      if (method) {
        resolutionMethods[method] = (resolutionMethods[method] || 0) + 1;
      }
    });

    const resolutionTimes = resolutionEvents
      .filter(event => typeof event.data.timeToResolution === 'number')
      .map(event => event.data.timeToResolution);

    const averageResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
      : 0;

    const mostCommonErrors = Object.entries(errorsByCode)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([code]) => code);

    return {
      totalErrors: errorEvents.length,
      errorsByType,
      errorsByCode,
      mostCommonErrors,
      averageResolutionTime,
      resolutionMethods,
      lastUpdated: Date.now()
    };
  }

  /**
   * Analyze error patterns and identify trends
   */
  getErrorPatterns(): ErrorPatterns {
    const errorEvents = this.events.filter(event => event.type === 'error_occurred');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Find error spikes (5+ errors of same type within 1 hour)
    const spikes: ErrorPattern[] = [];
    const errorGroups: Record<string, AnalyticsEvent[]> = {};

    errorEvents.forEach(event => {
      const errorCode = event.data.errorCode || 'unknown';
      if (!errorGroups[errorCode]) {
        errorGroups[errorCode] = [];
      }
      errorGroups[errorCode].push(event);
    });

    Object.entries(errorGroups).forEach(([errorCode, events]) => {
      if (events.length >= 5) {
        const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);
        const timeSpan = sortedEvents[sortedEvents.length - 1].timestamp - sortedEvents[0].timestamp;
        
        if (timeSpan <= oneHour) {
          const uniqueUsers = new Set(events.map(event => event.userId)).size;
          
          spikes.push({
            errorCode,
            frequency: events.length,
            timeRange: {
              start: sortedEvents[0].timestamp,
              end: sortedEvents[sortedEvents.length - 1].timestamp
            },
            affectedUsers: uniqueUsers,
            severity: events.length >= 20 ? 'critical' : 
                     events.length >= 10 ? 'high' : 
                     events.length >= 5 ? 'medium' : 'low'
          });
        }
      }
    });

    // Analyze trends (simplified implementation)
    const trends = {
      increasing: [] as string[],
      decreasing: [] as string[],
      stable: [] as string[]
    };

    // Generate recommendations based on patterns
    const recommendations: string[] = [];
    if (spikes.length > 0) {
      recommendations.push('High error frequency detected - consider implementing circuit breakers');
    }
    if (spikes.some(spike => spike.errorCode.includes('429'))) {
      recommendations.push('Rate limiting issues detected - implement exponential backoff');
    }

    return {
      spikes,
      trends,
      recommendations
    };
  }

  /**
   * Set privacy settings
   */
  setPrivacySettings(settings: Partial<PrivacySettings>): void {
    this.privacySettings = { ...this.privacySettings, ...settings };
    this.persistToStorage();
  }

  /**
   * Export user data for GDPR compliance
   */
  exportUserData(userId: string): UserDataExport {
    const userEvents = this.events.filter(event => event.userId === userId);
    
    // Calculate user-specific metrics
    const userSeoEvents = userEvents.filter(event => event.type === 'seo_recommendation_applied');
    const userErrorEvents = userEvents.filter(event => event.type === 'error_occurred');

    const successMetrics: SuccessMetrics = {
      totalApplications: userSeoEvents.length,
      successfulApplications: userSeoEvents.filter(event => event.data.success).length,
      successRate: userSeoEvents.length > 0 ? 
        userSeoEvents.filter(event => event.data.success).length / userSeoEvents.length : 0,
      averageDuration: userSeoEvents.length > 0 ?
        userSeoEvents.reduce((sum, event) => sum + (event.data.duration || 0), 0) / userSeoEvents.length : 0,
      lastUpdated: Date.now()
    };

    return {
      userId,
      events: userEvents,
      metrics: {
        success: successMetrics,
        usage: {
          totalSessions: new Set(userEvents.map(event => event.sessionId)).size,
          uniqueUsers: 1,
          lastUpdated: Date.now()
        },
        errors: {
          totalErrors: userErrorEvents.length,
          lastUpdated: Date.now()
        }
      },
      exportTimestamp: Date.now(),
      exportVersion: '1.0.0'
    };
  }

  /**
   * Delete all user data for GDPR compliance
   */
  async deleteUserData(userId: string): Promise<void> {
    this.events = this.events.filter(event => event.userId !== userId);
    await this.persistToStorage();

    // Also remove from remote if configured
    if (this.privacySettings.enableRemoteSync && this.config.apiEndpoint) {
      try {
        await fetch(`${this.config.apiEndpoint}/user/${userId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      } catch (error) {
        console.warn('Failed to delete user data from remote:', error);
      }
    }
  }

  /**
   * Sync with remote analytics service
   */
  async syncWithRemote(): Promise<void> {
    if (!this.config.apiEndpoint || !this.privacySettings.enableRemoteSync) {
      return;
    }

    // Get unsent events (simplified - in real implementation, track sent status)
    const eventsToSend = this.events.slice(-this.config.batchSize);

    if (eventsToSend.length === 0) {
      return;
    }

    try {
      const response = await fetch(`${this.config.apiEndpoint}/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToSend,
          metadata: {
            timestamp: Date.now(),
            version: '1.0.0'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Mark events as sent (simplified implementation)
      console.log(`Successfully synced ${eventsToSend.length} events`);
    } catch (error) {
      console.warn('Failed to sync with remote analytics:', error);
      throw error;
    }
  }

  /**
   * Persist data to localStorage
   */
  private async persistToStorage(): Promise<void> {
    try {
      const data: AnalyticsStorageData = {
        events: this.events.slice(-this.config.maxStorageEvents), // Keep only recent events
        metadata: {
          version: '1.0.0',
          lastSynced: Date.now(),
          totalEvents: this.events.length
        },
        settings: this.privacySettings
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist analytics data:', error);
    }
  }

  /**
   * Anonymize event data for privacy
   */
  private anonymizeEvent(event: AnalyticsEvent): AnalyticsEvent {
    return {
      ...event,
      userId: this.hashString(event.userId),
      sessionId: this.hashString(event.sessionId),
      data: {
        ...event.data,
        // Remove or hash any potentially identifying information
        pageId: event.data.pageId ? this.hashString(event.data.pageId) : undefined,
        cmsItemId: event.data.cmsItemId ? this.hashString(event.data.cmsItemId) : undefined
      }
    };
  }

  /**
   * Simple hash function for anonymization
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Clean up old events based on retention policy
   */
  private cleanupOldEvents(): void {
    const retentionPeriod = this.privacySettings.dataRetentionDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionPeriod;

    this.events = this.events.filter(event => event.timestamp > cutoffTime);
  }
}

export const analyticsService = new AnalyticsService();