/**
 * Multi-Agent Orchestration System
 * 
 * This module provides a complete multi-agent system for automated code generation,
 * testing, and task coordination. Based on the principles from the multi-agent
 * orchestration guide, it enables parallel development workflows.
 */

// Core components
export { BaseAgent } from './BaseAgent';
export { CodeAgent } from './CodeAgent';
export { TestAgent } from './TestAgent';
export { Orchestrator } from './Orchestrator';

// Configuration and error handling
export { 
  loadAgentConfig, 
  validateConfig, 
  defaultAgentConfig,
  createDevelopmentConfig,
  createProductionConfig,
  createTestConfig 
} from './config';

export { 
  ErrorHandler, 
  AgentError, 
  TaskResultHandler, 
  MessageValidator,
  defaultRetryConfig 
} from './ErrorHandler';

// Types are exported through shared/types/index.ts
export type { 
  AgentTask, 
  AgentCapability, 
  AgentMessage, 
  AgentStatus, 
  TaskResult,
  TaskDependency,
  FileConflict,
  OrchestratorEvent,
  AgentConfig,
  AgentLock
} from '../../shared/types/agents';

// Example usage
export { parallelDevelopmentExample } from './example';

/**
 * Quick start example:
 * 
 * ```typescript
 * import { Orchestrator, createDevelopmentConfig } from './workers/agents';
 * 
 * const orchestrator = new Orchestrator(createDevelopmentConfig());
 * 
 * const taskId = await orchestrator.createTask({
 *   type: 'code',
 *   priority: 'high',
 *   description: 'Create UserProfile component',
 *   dependencies: [],
 *   files: ['client/src/components/UserProfile.tsx'],
 *   context: {
 *     componentType: 'react-component',
 *     componentName: 'UserProfile'
 *   }
 * });
 * ```
 */