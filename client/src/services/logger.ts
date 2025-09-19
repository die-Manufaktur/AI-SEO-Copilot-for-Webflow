/**
 * Comprehensive Logging Service
 * Provides structured logging with multiple transport options
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  category?: string;
  tags?: string[];
  correlation_id?: string;
  performance?: {
    memory?: number;
    timing?: number;
    navigation?: any;
  };
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LoggerConfiguration {
  level: LogLevel;
  enableConsole: boolean;
  enableLocalStorage: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxLocalEntries: number;
  enablePerformanceLogging: boolean;
  enableUserTracking: boolean;
  enableStackTrace: boolean;
  filterSensitiveData: boolean;
  enableBatching: boolean;
  batchSize: number;
  batchTimeout: number;
}

export interface LogTransport {
  name: string;
  log(entry: LogEntry): Promise<void> | void;
  flush?(): Promise<void> | void;
}

class Logger {
  private config: LoggerConfiguration;
  private transports: LogTransport[] = [];
  private localEntries: LogEntry[] = [];
  private pendingBatch: LogEntry[] = [];
  private batchTimer?: number;
  private sessionId: string;

  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  private readonly sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'credential',
    'ssn',
    'credit_card',
    'api_key',
    'access_token',
    'refresh_token',
  ];

  constructor(config?: Partial<LoggerConfiguration>) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableLocalStorage: true,
      enableRemote: false,
      maxLocalEntries: 1000,
      enablePerformanceLogging: true,
      enableUserTracking: true,
      enableStackTrace: true,
      filterSensitiveData: true,
      enableBatching: true,
      batchSize: 10,
      batchTimeout: 5000,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.setupTransports();
    this.setupGlobalErrorHandling();
    this.setupPerformanceMonitoring();
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  /**
   * Log fatal error message
   */
  fatal(message: string, context?: Record<string, any>): void {
    this.log('fatal', message, context);
  }

  /**
   * Core logging method
   */
  private async log(level: LogLevel, message: string, context?: Record<string, any>): Promise<void> {
    // Check if log level is enabled
    if (this.levelPriority[level] < this.levelPriority[this.config.level]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      correlation_id: this.generateCorrelationId(),
    };

    // Add context
    if (context) {
      entry.context = this.config.filterSensitiveData 
        ? this.filterSensitiveData(context)
        : context;
    }

    // Add user information
    if (this.config.enableUserTracking) {
      entry.userId = this.getCurrentUserId();
    }

    // Add performance information
    if (this.config.enablePerformanceLogging) {
      entry.performance = this.getPerformanceMetrics();
    }

    // Add stack trace for errors
    if ((level === 'error' || level === 'fatal') && this.config.enableStackTrace) {
      const error = new Error();
      entry.error = {
        name: 'LoggedError',
        message,
        stack: error.stack,
      };
    }

    // Store locally
    if (this.config.enableLocalStorage) {
      this.localEntries.push(entry);
      if (this.localEntries.length > this.config.maxLocalEntries) {
        this.localEntries.shift();
      }
    }

    // Send to transports
    if (this.config.enableBatching && level !== 'fatal') {
      this.addToBatch(entry);
    } else {
      await this.sendToTransports(entry);
    }
  }

  /**
   * Log user action
   */
  logUserAction(action: string, component?: string, context?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      ...context,
      action,
      component,
      category: 'user_action',
      tags: ['user', 'interaction'],
    });
  }

  /**
   * Log API call
   */
  logApiCall(
    endpoint: string, 
    method: string, 
    duration: number, 
    success: boolean, 
    context?: Record<string, any>
  ): void {
    const level = success ? 'info' : 'error';
    this.log(level, `API call: ${method} ${endpoint}`, {
      ...context,
      endpoint,
      method,
      duration,
      success,
      category: 'api_call',
      tags: ['api', 'network'],
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, context?: Record<string, any>): void {
    this.info(`Performance: ${operation}`, {
      ...context,
      operation,
      duration,
      category: 'performance',
      tags: ['performance', 'timing'],
    });
  }

  /**
   * Log navigation event
   */
  logNavigation(from: string, to: string, context?: Record<string, any>): void {
    this.info(`Navigation: ${from} → ${to}`, {
      ...context,
      from,
      to,
      category: 'navigation',
      tags: ['navigation', 'routing'],
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: Record<string, any>): void {
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    this.log(level, `Security event: ${event}`, {
      ...context,
      event,
      severity,
      category: 'security',
      tags: ['security', 'audit'],
    });
  }

  /**
   * Get log entries
   */
  getLogs(filter?: Partial<LogEntry>): LogEntry[] {
    if (!filter) return [...this.localEntries];

    return this.localEntries.filter(entry => {
      return Object.entries(filter).every(([key, value]) => 
        entry[key as keyof LogEntry] === value
      );
    });
  }

  /**
   * Export logs
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.convertToCSV(this.localEntries);
    }
    return JSON.stringify(this.localEntries, null, 2);
  }

  /**
   * Clear local logs
   */
  clearLogs(): void {
    this.localEntries = [];
  }

  /**
   * Flush pending logs
   */
  async flush(): Promise<void> {
    if (this.pendingBatch.length > 0) {
      await this.flushBatch();
    }

    // Flush all transports
    await Promise.all(
      this.transports
        .filter(transport => transport.flush)
        .map(transport => transport.flush!())
    );
  }

  /**
   * Add custom transport
   */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  /**
   * Remove transport
   */
  removeTransport(name: string): void {
    this.transports = this.transports.filter(transport => transport.name !== name);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LoggerConfiguration>): void {
    this.config = { ...this.config, ...config };
  }

  private setupTransports(): void {
    // Console transport
    if (this.config.enableConsole) {
      this.addTransport(new ConsoleTransport());
    }

    // Remote transport
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.addTransport(new RemoteTransport(this.config.remoteEndpoint));
    }
  }

  private setupGlobalErrorHandling(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        category: 'unhandled_error',
        tags: ['error', 'promise', 'unhandled'],
      });
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.error('Global error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? {
          name: event.error.name,
          message: event.error.message,
          stack: event.error.stack,
        } : undefined,
        category: 'global_error',
        tags: ['error', 'global'],
      });
    });
  }

  private setupPerformanceMonitoring(): void {
    if (!this.config.enablePerformanceLogging) return;

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Log tasks longer than 50ms
              this.warn('Long task detected', {
                duration: entry.duration,
                startTime: entry.startTime,
                category: 'performance',
                tags: ['performance', 'long_task'],
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // PerformanceObserver not supported or failed
      }
    }

    // Monitor navigation timing
    if (performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = performance.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          
          this.info('Page load completed', {
            loadTime,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            firstPaint: timing.responseStart - timing.navigationStart,
            category: 'performance',
            tags: ['performance', 'navigation', 'load'],
          });
        }, 0);
      });
    }
  }

  private addToBatch(entry: LogEntry): void {
    this.pendingBatch.push(entry);

    if (this.pendingBatch.length >= this.config.batchSize) {
      this.flushBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = window.setTimeout(() => {
        this.flushBatch();
      }, this.config.batchTimeout);
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.pendingBatch.length === 0) return;

    const batch = [...this.pendingBatch];
    this.pendingBatch = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    for (const entry of batch) {
      await this.sendToTransports(entry);
    }
  }

  private async sendToTransports(entry: LogEntry): Promise<void> {
    await Promise.all(
      this.transports.map(async transport => {
        try {
          await transport.log(entry);
        } catch (error) {
          console.error(`Transport ${transport.name} failed:`, error);
        }
      })
    );
  }

  private filterSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.filterSensitiveData(item));
    }

    const filtered: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.sensitiveFields.some(field => lowerKey.includes(field));
      
      if (isSensitive) {
        filtered[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        filtered[key] = this.filterSensitiveData(value);
      } else {
        filtered[key] = value;
      }
    }

    return filtered;
  }

  private getCurrentUserId(): string | undefined {
    try {
      const token = localStorage.getItem('webflow_token');
      if (token) {
        const parsed = JSON.parse(token);
        return parsed.user_id;
      }
    } catch (e) {
      // Ignore error
    }
    return undefined;
  }

  private getPerformanceMetrics(): LogEntry['performance'] {
    const performance = window.performance;
    
    return {
      memory: (performance as any).memory?.usedJSHeapSize,
      timing: performance.now(),
      navigation: performance.navigation ? {
        type: performance.navigation.type,
        redirectCount: performance.navigation.redirectCount,
      } : undefined,
    };
  }

  private generateSessionId(): string {
    let sessionId = sessionStorage.getItem('logger_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('logger_session_id', sessionId);
    }
    return sessionId;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private convertToCSV(entries: LogEntry[]): string {
    if (entries.length === 0) return '';

    const headers = ['timestamp', 'level', 'message', 'userId', 'sessionId', 'component', 'category'];
    const rows = entries.map(entry => [
      entry.timestamp,
      entry.level,
      entry.message,
      entry.userId || '',
      entry.sessionId || '',
      entry.component || '',
      entry.category || '',
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }
}

/**
 * Console transport
 */
class ConsoleTransport implements LogTransport {
  name = 'console';

  log(entry: LogEntry): void {
    const method = entry.level === 'debug' ? 'debug' :
                  entry.level === 'info' ? 'info' :
                  entry.level === 'warn' ? 'warn' : 'error';

    const style = entry.level === 'error' || entry.level === 'fatal' ? 'color: red' :
                  entry.level === 'warn' ? 'color: orange' :
                  entry.level === 'info' ? 'color: blue' : 'color: gray';

    console.groupCollapsed(`%c[${entry.level.toUpperCase()}] ${entry.message}`, style);
    console.log('Timestamp:', entry.timestamp);
    if (entry.context) console.log('Context:', entry.context);
    if (entry.performance) console.log('Performance:', entry.performance);
    if (entry.error) console.error('Error:', entry.error);
    console.groupEnd();
  }
}

/**
 * Remote transport
 */
class RemoteTransport implements LogTransport {
  name = 'remote';
  private endpoint: string;
  private queue: LogEntry[] = [];
  private sending = false;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async log(entry: LogEntry): Promise<void> {
    this.queue.push(entry);
    
    if (!this.sending) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0 || this.sending) return;

    this.sending = true;
    const batch = [...this.queue];
    this.queue = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: batch }),
      });
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
      // Re-queue failed logs
      this.queue.unshift(...batch);
    } finally {
      this.sending = false;
    }
  }
}

// Export singleton instance
export const logger = new Logger();