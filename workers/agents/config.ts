import type { AgentConfig } from '../../shared/types/agents';

export const defaultAgentConfig: AgentConfig = {
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD
  },
  agents: {
    'code-agent-01': {
      capabilities: {
        name: 'Code Generator and Modifier',
        filePatterns: [
          'client/src/**/*.tsx',
          'client/src/**/*.ts',
          'workers/**/*.ts',
          'shared/**/*.ts',
          '*.config.*',
          'package.json',
          'tsconfig.json'
        ],
        taskTypes: ['code', 'refactor'],
        description: 'Handles React component generation, API routes, type definitions, and configuration updates',
        languages: ['TypeScript', 'JavaScript', 'JSON'],
        frameworks: ['React', 'Vite', 'Hono', 'Vitest'],
        maxConcurrentTasks: 3
      },
      maxRetries: 3,
      timeout: 300000 // 5 minutes
    },
    'test-agent-01': {
      capabilities: {
        name: 'Test Generator and Validator',
        filePatterns: [
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/*.spec.ts',
          '**/*.spec.tsx',
          'vitest.config.ts',
          'setupTests.ts'
        ],
        taskTypes: ['test'],
        description: 'Generates unit tests, integration tests, and validates test coverage using Vitest and Testing Library',
        languages: ['TypeScript', 'JavaScript'],
        frameworks: ['Vitest', 'Testing Library', 'jsdom'],
        maxConcurrentTasks: 2
      },
      maxRetries: 2,
      timeout: 180000 // 3 minutes
    }
  },
  orchestrator: {
    taskQueueSize: 100,
    conflictResolutionStrategy: 'queue',
    maxConcurrentTasks: 5
  }
};

export function loadAgentConfig(): AgentConfig {
  // In a real implementation, this would load from environment variables,
  // configuration files, or a configuration service
  
  const config = { ...defaultAgentConfig };
  
  // Override with environment variables
  if (process.env.AGENT_CONFIG_CONFLICT_STRATEGY) {
    config.orchestrator.conflictResolutionStrategy = 
      process.env.AGENT_CONFIG_CONFLICT_STRATEGY as 'queue' | 'merge' | 'abort';
  }
  
  if (process.env.AGENT_CONFIG_MAX_CONCURRENT_TASKS) {
    config.orchestrator.maxConcurrentTasks = 
      parseInt(process.env.AGENT_CONFIG_MAX_CONCURRENT_TASKS, 10);
  }
  
  if (process.env.AGENT_CONFIG_TASK_QUEUE_SIZE) {
    config.orchestrator.taskQueueSize = 
      parseInt(process.env.AGENT_CONFIG_TASK_QUEUE_SIZE, 10);
  }

  return config;
}

export function validateConfig(config: AgentConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate Redis configuration
  if (!config.redis.url) {
    errors.push('Redis URL is required');
  }

  // Validate agent configurations
  for (const [agentId, agentConfig] of Object.entries(config.agents)) {
    if (!agentConfig.capabilities.name) {
      errors.push(`Agent ${agentId} must have a name`);
    }
    
    if (agentConfig.capabilities.filePatterns.length === 0) {
      errors.push(`Agent ${agentId} must have at least one file pattern`);
    }
    
    if (agentConfig.capabilities.taskTypes.length === 0) {
      errors.push(`Agent ${agentId} must support at least one task type`);
    }
    
    if (agentConfig.maxRetries < 0) {
      errors.push(`Agent ${agentId} maxRetries must be non-negative`);
    }
    
    if (agentConfig.timeout <= 0) {
      errors.push(`Agent ${agentId} timeout must be positive`);
    }
  }

  // Validate orchestrator configuration
  if (config.orchestrator.taskQueueSize <= 0) {
    errors.push('Task queue size must be positive');
  }
  
  if (config.orchestrator.maxConcurrentTasks <= 0) {
    errors.push('Max concurrent tasks must be positive');
  }

  const validStrategies = ['queue', 'merge', 'abort'];
  if (!validStrategies.includes(config.orchestrator.conflictResolutionStrategy)) {
    errors.push(`Conflict resolution strategy must be one of: ${validStrategies.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function createDevelopmentConfig(): AgentConfig {
  return {
    ...defaultAgentConfig,
    orchestrator: {
      ...defaultAgentConfig.orchestrator,
      maxConcurrentTasks: 2, // Reduced for development
      conflictResolutionStrategy: 'queue'
    }
  };
}

export function createProductionConfig(): AgentConfig {
  return {
    ...defaultAgentConfig,
    redis: {
      url: process.env.REDIS_URL || 'redis://prod-redis:6379',
      password: process.env.REDIS_PASSWORD
    },
    orchestrator: {
      ...defaultAgentConfig.orchestrator,
      maxConcurrentTasks: 10, // Higher throughput for production
      conflictResolutionStrategy: 'merge'
    }
  };
}

export function createTestConfig(): AgentConfig {
  return {
    ...defaultAgentConfig,
    redis: {
      url: 'redis://localhost:6380', // Different port for testing
      password: undefined
    },
    orchestrator: {
      ...defaultAgentConfig.orchestrator,
      taskQueueSize: 10,
      maxConcurrentTasks: 1, // Sequential execution for deterministic tests
      conflictResolutionStrategy: 'abort'
    }
  };
}