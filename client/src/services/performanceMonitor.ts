/**
 * Performance Monitoring Service
 * Tracks and optimizes application performance
 */

export interface PerformanceMetrics {
  // API Performance
  apiResponseTimes: Map<string, number[]>;
  apiErrorRates: Map<string, number>;
  rateLimitHits: number;
  
  // UI Performance
  renderTimes: Map<string, number[]>;
  componentMountTimes: Map<string, number>;
  
  // User Experience
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  
  // Business Metrics
  operationSuccessRates: Map<string, number>;
  userEngagementMetrics: {
    sessionsPerUser: number;
    averageSessionDuration: number;
    operationsPerSession: number;
  };
}

export interface PerformanceAlert {
  type: 'error_rate' | 'response_time' | 'rate_limit' | 'render_time';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: number;
  endpoint?: string;
  component?: string;
}

export interface OptimizationSuggestion {
  category: 'api' | 'ui' | 'bundle' | 'cache';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  implementation: string;
  estimatedImpact: string;
  effort: 'low' | 'medium' | 'high';
}

class PerformanceMonitorService {
  private metrics: PerformanceMetrics;
  private alerts: PerformanceAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval?: number;
  
  // Thresholds for alerts
  private readonly thresholds = {
    apiResponseTime: 2000, // 2 seconds
    apiErrorRate: 0.05, // 5%
    renderTime: 100, // 100ms
    rateLimitHour: 50, // 50 hits per hour
  };

  constructor() {
    this.metrics = this.initializeMetrics();
    this.setupPerformanceObserver();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
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
    };
  }

  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined') return;

    // Web Vitals Observer
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        this.metrics.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.metrics.firstContentfulPaint = fcpEntry.startTime;
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.metrics.cumulativeLayoutShift += clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Check for alerts every 30 seconds
    this.monitoringInterval = window.setInterval(() => {
      this.checkThresholds();
      this.optimizePerformance();
    }, 30000);
    
    console.log('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    console.log('Performance monitoring stopped');
  }

  /**
   * Track API call performance
   */
  trackApiCall(endpoint: string, duration: number, success: boolean): void {
    // Track response time
    if (!this.metrics.apiResponseTimes.has(endpoint)) {
      this.metrics.apiResponseTimes.set(endpoint, []);
    }
    this.metrics.apiResponseTimes.get(endpoint)!.push(duration);
    
    // Keep only last 100 measurements
    const times = this.metrics.apiResponseTimes.get(endpoint)!;
    if (times.length > 100) {
      times.splice(0, times.length - 100);
    }
    
    // Track error rate
    if (!this.metrics.apiErrorRates.has(endpoint)) {
      this.metrics.apiErrorRates.set(endpoint, 0);
    }
    
    if (!success) {
      const currentErrors = this.metrics.apiErrorRates.get(endpoint)!;
      this.metrics.apiErrorRates.set(endpoint, currentErrors + 1);
    }
    
    // Track operation success rate
    if (!this.metrics.operationSuccessRates.has(endpoint)) {
      this.metrics.operationSuccessRates.set(endpoint, 0);
    }
    
    const currentSuccessRate = this.metrics.operationSuccessRates.get(endpoint)!;
    const newSuccessRate = success ? 
      (currentSuccessRate + 1) : 
      Math.max(0, currentSuccessRate - 0.1);
    this.metrics.operationSuccessRates.set(endpoint, newSuccessRate);
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, duration: number): void {
    if (!this.metrics.renderTimes.has(componentName)) {
      this.metrics.renderTimes.set(componentName, []);
    }
    
    this.metrics.renderTimes.get(componentName)!.push(duration);
    
    // Keep only last 50 measurements
    const times = this.metrics.renderTimes.get(componentName)!;
    if (times.length > 50) {
      times.splice(0, times.length - 50);
    }
  }

  /**
   * Track component mount time
   */
  trackComponentMount(componentName: string, duration: number): void {
    this.metrics.componentMountTimes.set(componentName, duration);
  }

  /**
   * Track rate limit hit
   */
  trackRateLimitHit(): void {
    this.metrics.rateLimitHits++;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // API optimization suggestions
    for (const [endpoint, times] of this.metrics.apiResponseTimes) {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      if (avgTime > this.thresholds.apiResponseTime) {
        suggestions.push({
          category: 'api',
          priority: 'high',
          title: `Optimize ${endpoint} API calls`,
          description: `Average response time is ${Math.round(avgTime)}ms, exceeding ${this.thresholds.apiResponseTime}ms threshold`,
          implementation: 'Consider adding request caching, optimizing database queries, or implementing pagination',
          estimatedImpact: `Could reduce response time by 30-50%`,
          effort: 'medium',
        });
      }
    }
    
    // UI optimization suggestions
    for (const [component, times] of this.metrics.renderTimes) {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      if (avgTime > this.thresholds.renderTime) {
        suggestions.push({
          category: 'ui',
          priority: 'medium',
          title: `Optimize ${component} component rendering`,
          description: `Average render time is ${Math.round(avgTime)}ms, exceeding ${this.thresholds.renderTime}ms threshold`,
          implementation: 'Consider using React.memo, useMemo, or useCallback to prevent unnecessary re-renders',
          estimatedImpact: `Could improve UI responsiveness by 20-40%`,
          effort: 'low',
        });
      }
    }
    
    // Rate limiting suggestions
    if (this.metrics.rateLimitHits > this.thresholds.rateLimitHour) {
      suggestions.push({
        category: 'api',
        priority: 'high',
        title: 'Implement intelligent request queuing',
        description: `${this.metrics.rateLimitHits} rate limit hits detected in the last hour`,
        implementation: 'Add request queuing with exponential backoff and batch operations',
        estimatedImpact: `Could reduce rate limit hits by 80-90%`,
        effort: 'high',
      });
    }
    
    // Bundle optimization suggestions
    if (this.metrics.largestContentfulPaint > 2500) {
      suggestions.push({
        category: 'bundle',
        priority: 'high',
        title: 'Optimize bundle size and loading',
        description: `LCP is ${Math.round(this.metrics.largestContentfulPaint)}ms, exceeding 2500ms threshold`,
        implementation: 'Implement code splitting, lazy loading, and tree shaking',
        estimatedImpact: `Could improve LCP by 30-50%`,
        effort: 'high',
      });
    }
    
    return suggestions;
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    summary: {
      overallScore: number;
      apiScore: number;
      uiScore: number;
      webVitalsScore: number;
    };
    insights: string[];
    recommendations: OptimizationSuggestion[];
  } {
    // Calculate scores (0-100)
    const apiScore = this.calculateApiScore();
    const uiScore = this.calculateUiScore();
    const webVitalsScore = this.calculateWebVitalsScore();
    const overallScore = Math.round((apiScore + uiScore + webVitalsScore) / 3);
    
    const insights = this.generateInsights();
    const recommendations = this.getOptimizationSuggestions();
    
    return {
      summary: {
        overallScore,
        apiScore,
        uiScore,
        webVitalsScore,
      },
      insights,
      recommendations,
    };
  }

  private calculateApiScore(): number {
    let score = 100;
    
    // Deduct points for slow API calls
    for (const times of this.metrics.apiResponseTimes.values()) {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      if (avgTime > this.thresholds.apiResponseTime) {
        score -= Math.min(20, (avgTime - this.thresholds.apiResponseTime) / 100);
      }
    }
    
    // Deduct points for high error rates
    for (const errorRate of this.metrics.apiErrorRates.values()) {
      if (errorRate > this.thresholds.apiErrorRate * 100) {
        score -= Math.min(30, errorRate);
      }
    }
    
    return Math.max(0, Math.round(score));
  }

  private calculateUiScore(): number {
    let score = 100;
    
    // Deduct points for slow renders
    for (const times of this.metrics.renderTimes.values()) {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      if (avgTime > this.thresholds.renderTime) {
        score -= Math.min(15, (avgTime - this.thresholds.renderTime) / 10);
      }
    }
    
    return Math.max(0, Math.round(score));
  }

  private calculateWebVitalsScore(): number {
    let score = 100;
    
    // LCP scoring
    if (this.metrics.largestContentfulPaint > 4000) {
      score -= 40;
    } else if (this.metrics.largestContentfulPaint > 2500) {
      score -= 20;
    }
    
    // FCP scoring
    if (this.metrics.firstContentfulPaint > 3000) {
      score -= 30;
    } else if (this.metrics.firstContentfulPaint > 1800) {
      score -= 15;
    }
    
    // CLS scoring
    if (this.metrics.cumulativeLayoutShift > 0.25) {
      score -= 30;
    } else if (this.metrics.cumulativeLayoutShift > 0.1) {
      score -= 15;
    }
    
    return Math.max(0, Math.round(score));
  }

  private generateInsights(): string[] {
    const insights: string[] = [];
    
    // API insights
    const apiEndpoints = Array.from(this.metrics.apiResponseTimes.keys());
    if (apiEndpoints.length > 0) {
      const slowestEndpoint = apiEndpoints.reduce((slowest, endpoint) => {
        const times = this.metrics.apiResponseTimes.get(endpoint)!;
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const slowestTimes = this.metrics.apiResponseTimes.get(slowest)!;
        const slowestAvg = slowestTimes.reduce((sum, time) => sum + time, 0) / slowestTimes.length;
        return avgTime > slowestAvg ? endpoint : slowest;
      });
      
      const slowestTimes = this.metrics.apiResponseTimes.get(slowestEndpoint)!;
      const slowestAvg = slowestTimes.reduce((sum, time) => sum + time, 0) / slowestTimes.length;
      
      insights.push(`${slowestEndpoint} is your slowest API endpoint with ${Math.round(slowestAvg)}ms average response time`);
    }
    
    // UI insights
    const components = Array.from(this.metrics.renderTimes.keys());
    if (components.length > 0) {
      const slowestComponent = components.reduce((slowest, component) => {
        const times = this.metrics.renderTimes.get(component)!;
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const slowestTimes = this.metrics.renderTimes.get(slowest)!;
        const slowestAvg = slowestTimes.reduce((sum, time) => sum + time, 0) / slowestTimes.length;
        return avgTime > slowestAvg ? component : slowest;
      });
      
      const slowestTimes = this.metrics.renderTimes.get(slowestComponent)!;
      const slowestAvg = slowestTimes.reduce((sum, time) => sum + time, 0) / slowestTimes.length;
      
      insights.push(`${slowestComponent} component takes ${Math.round(slowestAvg)}ms average render time`);
    }
    
    // Web Vitals insights
    if (this.metrics.largestContentfulPaint > 2500) {
      insights.push(`LCP of ${Math.round(this.metrics.largestContentfulPaint)}ms indicates slow loading performance`);
    }
    
    if (this.metrics.cumulativeLayoutShift > 0.1) {
      insights.push(`CLS of ${this.metrics.cumulativeLayoutShift.toFixed(3)} indicates layout stability issues`);
    }
    
    return insights;
  }

  private checkThresholds(): void {
    // Check API response time thresholds
    for (const [endpoint, times] of this.metrics.apiResponseTimes) {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      if (avgTime > this.thresholds.apiResponseTime) {
        this.addAlert({
          type: 'response_time',
          severity: avgTime > this.thresholds.apiResponseTime * 2 ? 'critical' : 'medium',
          message: `${endpoint} API response time is ${Math.round(avgTime)}ms`,
          threshold: this.thresholds.apiResponseTime,
          currentValue: avgTime,
          timestamp: Date.now(),
          endpoint,
        });
      }
    }
    
    // Check rate limit threshold
    if (this.metrics.rateLimitHits > this.thresholds.rateLimitHour) {
      this.addAlert({
        type: 'rate_limit',
        severity: 'high',
        message: `Rate limit hit ${this.metrics.rateLimitHits} times in the last hour`,
        threshold: this.thresholds.rateLimitHour,
        currentValue: this.metrics.rateLimitHits,
        timestamp: Date.now(),
      });
    }
  }

  private addAlert(alert: PerformanceAlert): void {
    // Avoid duplicate alerts
    const existingAlert = this.alerts.find(a => 
      a.type === alert.type && 
      a.endpoint === alert.endpoint && 
      a.component === alert.component
    );
    
    if (!existingAlert) {
      this.alerts.push(alert);
      
      // Keep only last 50 alerts
      if (this.alerts.length > 50) {
        this.alerts.splice(0, this.alerts.length - 50);
      }
      
      console.warn('Performance Alert:', alert);
    }
  }

  private optimizePerformance(): void {
    // Auto-optimization strategies
    
    // Clear old metrics to prevent memory leaks
    for (const [endpoint, times] of this.metrics.apiResponseTimes) {
      if (times.length > 200) {
        times.splice(0, times.length - 100);
      }
    }
    
    for (const [component, times] of this.metrics.renderTimes) {
      if (times.length > 100) {
        times.splice(0, times.length - 50);
      }
    }
    
    // Reset rate limit counter every hour
    if (Date.now() % (60 * 60 * 1000) < 30000) {
      this.metrics.rateLimitHits = 0;
    }
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      alerts: this.getAlerts(),
      suggestions: this.getOptimizationSuggestions(),
      report: this.generateReport(),
    };
    
    return JSON.stringify(exportData, null, 2);
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitorService();