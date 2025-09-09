import type { AgentTask, TaskResult, AgentMessage } from '../../shared/types/agents';

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface ErrorContext {
  taskId: string;
  agentId: string;
  operation: string;
  timestamp: Date;
  attempt: number;
  totalAttempts: number;
}

export class AgentError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly context: ErrorContext;

  constructor(
    message: string,
    code: string,
    retryable: boolean,
    context: ErrorContext
  ) {
    super(message);
    this.name = 'AgentError';
    this.code = code;
    this.retryable = retryable;
    this.context = context;
  }
}

export class ErrorHandler {
  private retryAttempts: Map<string, number> = new Map();
  private config: RetryConfig;

  constructor(config: RetryConfig) {
    this.config = config;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: Omit<ErrorContext, 'attempt' | 'totalAttempts'>
  ): Promise<T> {
    const taskKey = `${context.taskId}-${context.operation}`;
    const currentAttempts = this.retryAttempts.get(taskKey) || 0;

    const fullContext: ErrorContext = {
      ...context,
      attempt: currentAttempts + 1,
      totalAttempts: this.config.maxRetries + 1
    };

    try {
      const result = await operation();
      
      // Success - reset retry counter
      this.retryAttempts.delete(taskKey);
      return result;

    } catch (error) {
      const agentError = this.wrapError(error as Error, fullContext);
      
      if (!agentError.retryable || currentAttempts >= this.config.maxRetries) {
        // Max retries reached or error is not retryable
        this.retryAttempts.delete(taskKey);
        throw agentError;
      }

      // Increment retry counter
      this.retryAttempts.set(taskKey, currentAttempts + 1);

      // Calculate delay with exponential backoff
      const delay = this.calculateDelay(currentAttempts);
      
      console.warn(
        `Task ${context.taskId} failed (attempt ${fullContext.attempt}/${fullContext.totalAttempts}): ${agentError.message}. Retrying in ${delay}ms...`
      );

      await this.delay(delay);

      // Recursive retry
      return this.executeWithRetry(operation, context);
    }
  }

  private wrapError(error: Error, context: ErrorContext): AgentError {
    const code = this.categorizeError(error);
    const retryable = this.isRetryableError(error, code);

    return new AgentError(
      error.message,
      code,
      retryable,
      context
    );
  }

  private categorizeError(error: Error): string {
    if (error.message.includes('ENOENT')) return 'FILE_NOT_FOUND';
    if (error.message.includes('EACCES')) return 'PERMISSION_DENIED';
    if (error.message.includes('EMFILE')) return 'TOO_MANY_FILES';
    if (error.message.includes('ENOSPC')) return 'NO_SPACE_LEFT';
    if (error.message.includes('timeout')) return 'TIMEOUT';
    if (error.message.includes('network')) return 'NETWORK_ERROR';
    if (error.message.includes('parse') || error.message.includes('syntax')) return 'PARSE_ERROR';
    if (error.message.includes('conflict') || error.message.includes('lock')) return 'CONFLICT';
    if (error.message.includes('validation')) return 'VALIDATION_ERROR';
    
    return 'UNKNOWN_ERROR';
  }

  private isRetryableError(error: Error, code: string): boolean {
    // Non-retryable errors
    const nonRetryableErrors = [
      'PERMISSION_DENIED',
      'PARSE_ERROR',
      'VALIDATION_ERROR',
      'FILE_NOT_FOUND'
    ];

    if (nonRetryableErrors.includes(code)) {
      return false;
    }

    // Check against configured retryable errors
    return this.config.retryableErrors.includes(code) ||
           this.config.retryableErrors.includes('*');
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.baseDelayMs * 
      Math.pow(this.config.backoffMultiplier, attempt);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay;
    
    return Math.min(
      exponentialDelay + jitter,
      this.config.maxDelayMs
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRetryStatistics(): { [taskKey: string]: number } {
    return Object.fromEntries(this.retryAttempts);
  }

  clearRetryHistory(): void {
    this.retryAttempts.clear();
  }
}

export class TaskResultHandler {
  static createSuccessResult(
    taskId: string,
    filesModified: string[] = [],
    filesCreated: string[] = [],
    output?: string
  ): TaskResult {
    return {
      taskId,
      status: 'success',
      filesModified,
      filesCreated,
      filesDeleted: [],
      output,
      metrics: {
        duration: 0,
        linesOfCodeChanged: 0
      }
    };
  }

  static createFailureResult(
    taskId: string,
    error: string | Error,
    context?: Partial<TaskResult>
  ): TaskResult {
    const errorMessage = error instanceof Error ? error.message : error;
    
    return {
      taskId,
      status: 'failure',
      filesModified: context?.filesModified || [],
      filesCreated: context?.filesCreated || [],
      filesDeleted: context?.filesDeleted || [],
      errors: [errorMessage],
      warnings: context?.warnings,
      metrics: context?.metrics || {
        duration: 0,
        linesOfCodeChanged: 0
      }
    };
  }

  static createPartialResult(
    taskId: string,
    warning: string,
    context: Partial<TaskResult> = {}
  ): TaskResult {
    return {
      taskId,
      status: 'partial',
      filesModified: context.filesModified || [],
      filesCreated: context.filesCreated || [],
      filesDeleted: context.filesDeleted || [],
      warnings: [warning, ...(context.warnings || [])],
      output: context.output,
      metrics: context.metrics || {
        duration: 0,
        linesOfCodeChanged: 0
      }
    };
  }
}

export class MessageValidator {
  static validateAgentMessage(message: AgentMessage): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!message.from) {
      errors.push('Message must have a "from" field');
    }

    if (!message.to) {
      errors.push('Message must have a "to" field');
    }

    if (!message.taskId) {
      errors.push('Message must have a "taskId" field');
    }

    const validTypes = ['task_assignment', 'task_complete', 'conflict_detected', 'status_update', 'error', 'request_help'];
    if (!validTypes.includes(message.type)) {
      errors.push(`Message type must be one of: ${validTypes.join(', ')}`);
    }

    if (!message.timestamp || isNaN(message.timestamp.getTime())) {
      errors.push('Message must have a valid timestamp');
    }

    const validPriorities = ['high', 'medium', 'low'];
    if (!validPriorities.includes(message.priority)) {
      errors.push(`Message priority must be one of: ${validPriorities.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateTask(task: AgentTask): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!task.id) {
      errors.push('Task must have an ID');
    }

    const validTypes = ['code', 'test', 'docs', 'review', 'refactor'];
    if (!validTypes.includes(task.type)) {
      errors.push(`Task type must be one of: ${validTypes.join(', ')}`);
    }

    const validPriorities = ['high', 'medium', 'low'];
    if (!validPriorities.includes(task.priority)) {
      errors.push(`Task priority must be one of: ${validPriorities.join(', ')}`);
    }

    if (!task.description || task.description.trim().length === 0) {
      errors.push('Task must have a description');
    }

    if (!Array.isArray(task.files)) {
      errors.push('Task files must be an array');
    }

    if (!Array.isArray(task.dependencies)) {
      errors.push('Task dependencies must be an array');
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'blocked'];
    if (!validStatuses.includes(task.status)) {
      errors.push(`Task status must be one of: ${validStatuses.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    'TIMEOUT',
    'NETWORK_ERROR',
    'TOO_MANY_FILES',
    'NO_SPACE_LEFT',
    'CONFLICT',
    'UNKNOWN_ERROR'
  ]
};