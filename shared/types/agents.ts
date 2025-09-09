/**
 * Core types for multi-agent orchestration system
 */

export interface AgentTask {
  id: string;
  type: 'code' | 'test' | 'docs' | 'review' | 'refactor';
  priority: 'high' | 'medium' | 'low';
  description: string;
  dependencies: string[];
  files: string[];
  context: Record<string, unknown>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  assignedAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedDuration?: number;
  metadata?: {
    framework?: string;
    language?: string;
    testType?: 'unit' | 'integration' | 'e2e';
    complexity?: 'low' | 'medium' | 'high';
  };
}

export interface AgentCapability {
  name: string;
  filePatterns: string[];
  taskTypes: AgentTask['type'][];
  description: string;
  languages: string[];
  frameworks: string[];
  maxConcurrentTasks: number;
}

export interface AgentMessage {
  from: string;
  to: string;
  taskId: string;
  type: 'task_assignment' | 'task_complete' | 'conflict_detected' | 'status_update' | 'error' | 'request_help';
  payload: unknown;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
}

export interface FileConflict {
  filePath: string;
  conflictingTasks: string[];
  conflictType: 'write_write' | 'read_write' | 'dependency';
  resolution: 'queue' | 'merge' | 'abort';
}

export interface AgentStatus {
  id: string;
  name: string;
  status: 'idle' | 'busy' | 'error' | 'offline';
  currentTasks: string[];
  capabilities: AgentCapability;
  lastActivity: Date;
  performance: {
    tasksCompleted: number;
    averageTaskDuration: number;
    successRate: number;
  };
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  blocks: string[];
  dependencyType: 'sequential' | 'parallel' | 'conditional';
}

export interface AgentConfig {
  redis: {
    url: string;
    password?: string;
  };
  agents: {
    [agentId: string]: {
      capabilities: AgentCapability;
      maxRetries: number;
      timeout: number;
    };
  };
  orchestrator: {
    taskQueueSize: number;
    conflictResolutionStrategy: 'queue' | 'merge' | 'abort';
    maxConcurrentTasks: number;
  };
}

export interface TaskResult {
  taskId: string;
  status: 'success' | 'failure' | 'partial';
  filesModified: string[];
  filesCreated: string[];
  filesDeleted: string[];
  output?: string;
  errors?: string[];
  warnings?: string[];
  metrics?: {
    duration: number;
    linesOfCodeChanged: number;
    testsAdded?: number;
    coverageChange?: number;
  };
}

export interface AgentLock {
  filePath: string;
  taskId: string;
  agentId: string;
  lockType: 'read' | 'write';
  acquiredAt: Date;
  expiresAt: Date;
}

export interface OrchestratorEvent {
  type: 'task_created' | 'task_assigned' | 'task_completed' | 'conflict_detected' | 'agent_status_changed';
  timestamp: Date;
  data: unknown;
}