/**
 * Analytics Type Definitions
 * Types for comprehensive analytics tracking system
 */

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  userId: string;
  sessionId: string;
  data: Record<string, any>;
}

export type AnalyticsEventType =
  | 'session_started'
  | 'session_ended'
  | 'seo_recommendation_applied'
  | 'feature_used'
  | 'error_occurred'
  | 'error_resolved'
  | 'page_analyzed'
  | 'batch_operation_started'
  | 'batch_operation_completed'
  | 'rollback_executed'
  | 'user_feedback_submitted';

export interface SuccessMetrics {
  totalApplications: number;
  successfulApplications: number;
  successRate: number;
  averageDuration: number;
  lastUpdated: number;
}

export interface SuccessMetricsByType {
  [recommendationType: string]: SuccessMetrics;
}

export interface UsageMetrics {
  totalSessions: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  averageActionsPerSession: number;
  featureUsage: Record<string, number>;
  mostUsedFeatures: string[];
  peakUsageHours: number[];
  lastUpdated: number;
}

export interface TimeRangeMetrics {
  timestamp: number;
  events: number;
  successRate: number;
  errors: number;
  uniqueUsers: number;
}

export interface ErrorReport {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByCode: Record<string, number>;
  mostCommonErrors: string[];
  averageResolutionTime: number;
  resolutionMethods: Record<string, number>;
  lastUpdated: number;
}

export interface ErrorPattern {
  errorCode: string;
  frequency: number;
  timeRange: {
    start: number;
    end: number;
  };
  affectedUsers: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorPatterns {
  spikes: ErrorPattern[];
  trends: {
    increasing: string[];
    decreasing: string[];
    stable: string[];
  };
  recommendations: string[];
}

export interface PrivacySettings {
  enableTracking: boolean;
  enableRemoteSync: boolean;
  anonymizeUserData: boolean;
  dataRetentionDays: number;
}

export interface AnalyticsConfig {
  apiEndpoint: string;
  batchSize: number;
  syncInterval: number;
  maxStorageEvents: number;
  privacySettings: PrivacySettings;
}

export interface UserDataExport {
  userId: string;
  events: AnalyticsEvent[];
  metrics: {
    success: SuccessMetrics;
    usage: Partial<UsageMetrics>;
    errors: Partial<ErrorReport>;
  };
  exportTimestamp: number;
  exportVersion: string;
}

export interface AnalyticsStorageData {
  events: AnalyticsEvent[];
  metadata: {
    version: string;
    lastSynced: number;
    totalEvents: number;
  };
  settings: PrivacySettings;
}

// Specific event data interfaces
export interface SEORecommendationAppliedData {
  recommendationType: string;
  pageId?: string;
  cmsItemId?: string;
  success: boolean;
  duration: number;
  error?: string;
  source: 'ai_recommendation' | 'manual_entry' | 'batch_operation';
  rollbackId?: string;
}

export interface FeatureUsedData {
  feature: string;
  action: string;
  context?: Record<string, any>;
  duration?: number;
}

export interface ErrorOccurredData {
  errorType: string;
  errorMessage: string;
  errorCode?: string;
  errorId?: string;
  stack?: string;
  context?: Record<string, any>;
}

export interface ErrorResolvedData {
  errorId: string;
  resolutionMethod: string;
  timeToResolution: number;
  userAction?: string;
}

export interface SessionStartedData {
  source: string;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  referrer?: string;
}

export interface SessionEndedData {
  duration: number;
  actionsPerformed: number;
  pagesAnalyzed: number;
  recommendationsApplied: number;
}

export interface BatchOperationData {
  operationType: 'seo_recommendations' | 'cms_updates' | 'page_updates';
  itemCount: number;
  duration?: number;
  successCount?: number;
  failureCount?: number;
  rollbackId?: string;
}

export interface RollbackExecutedData {
  rollbackId: string;
  itemsRolledBack: number;
  duration: number;
  success: boolean;
  trigger: 'user_initiated' | 'automatic' | 'error_recovery';
}

export interface UserFeedbackData {
  feedbackType: 'bug_report' | 'feature_request' | 'satisfaction_survey';
  rating?: number;
  message?: string;
  category?: string;
  reproductionSteps?: string[];
}