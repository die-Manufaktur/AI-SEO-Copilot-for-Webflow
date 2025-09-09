import { Orchestrator } from './Orchestrator';
import { loadAgentConfig, createDevelopmentConfig } from './config';
import type { AgentTask } from '../../shared/types/agents';

/**
 * Example usage of the multi-agent orchestration system
 * This demonstrates how to create and execute tasks with the Code and Test agents
 */

async function main() {
  console.log('🚀 Starting Multi-Agent Orchestration Example');

  // Load configuration
  const config = createDevelopmentConfig();
  console.log('📋 Loaded development configuration');

  // Initialize orchestrator
  const orchestrator = new Orchestrator(config);
  console.log('🎯 Orchestrator initialized with agents:', 
    orchestrator.getAgentStatuses().map(a => a.name).join(', ')
  );

  try {
    // Example 1: Create a new React component
    console.log('\n📝 Example 1: Creating a new React component');
    
    const componentTask = await orchestrator.createTask({
      type: 'code',
      priority: 'high',
      description: 'Create a new UserProfile component with props interface',
      dependencies: [],
      files: [
        'client/src/components/UserProfile.tsx',
        'client/src/components/UserProfile.test.tsx'
      ],
      context: {
        componentType: 'react-component',
        componentName: 'UserProfile',
        props: {
          user: 'User',
          onEdit: '() => void',
          isEditable: 'boolean'
        }
      }
    });

    console.log(`✅ Component task created: ${componentTask}`);

    // Example 2: Generate tests for the component (depends on component creation)
    console.log('\n🧪 Example 2: Generating tests for the component');
    
    const testTask = await orchestrator.createTaskWithDependencies({
      type: 'test',
      priority: 'medium',
      description: 'Generate comprehensive unit tests for UserProfile component',
      dependencies: [],
      files: [
        'client/src/components/UserProfile.test.tsx'
      ],
      context: {
        testType: 'unit',
        sourceFiles: ['client/src/components/UserProfile.tsx']
      }
    }, [componentTask]); // This task depends on the component task

    console.log(`✅ Test task created: ${testTask}`);

    // Example 3: Create a new API module
    console.log('\n🔧 Example 3: Creating a new API module');
    
    const apiTask = await orchestrator.createTask({
      type: 'code',
      priority: 'medium',
      description: 'Create a new user management API module',
      dependencies: [],
      files: [
        'workers/modules/userManagement.ts'
      ],
      context: {
        moduleType: 'worker-module',
        moduleName: 'userManagement',
        description: 'Handles user CRUD operations'
      }
    });

    console.log(`✅ API module task created: ${apiTask}`);

    // Example 4: Add new types
    console.log('\n📋 Example 4: Adding new type definitions');
    
    const typesTask = await orchestrator.createTask({
      type: 'code',
      priority: 'low',
      description: 'Add User interface and related types',
      dependencies: [],
      files: [
        'shared/types/index.ts'
      ],
      context: {
        fileType: 'types',
        interfaceName: 'User',
        description: 'User account information',
        fields: {
          id: 'string',
          email: 'string',
          name: 'string',
          avatar: 'string | undefined',
          createdAt: 'Date',
          updatedAt: 'Date'
        }
      }
    });

    console.log(`✅ Types task created: ${typesTask}`);

    // Example 5: Integration test
    console.log('\n🔄 Example 5: Creating integration test');
    
    const integrationTask = await orchestrator.createTaskWithDependencies({
      type: 'test',
      priority: 'low',
      description: 'Create integration test for user management flow',
      dependencies: [],
      files: [
        'client/src/integration/userManagement.integration.test.tsx'
      ],
      context: {
        testType: 'integration',
        featureName: 'userManagement'
      }
    }, [componentTask, apiTask]); // Depends on both component and API

    console.log(`✅ Integration test task created: ${integrationTask}`);

    // Wait for all tasks to complete
    console.log('\n⏳ Waiting for tasks to complete...');
    
    let completedCount = 0;
    const totalTasks = 5;
    
    while (completedCount < totalTasks) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const tasks = orchestrator.getAllTasks();
      completedCount = tasks.filter(t => t.status === 'completed' || t.status === 'failed').length;
      
      console.log(`📊 Progress: ${completedCount}/${totalTasks} tasks completed`);
      
      // Show task statuses
      tasks.forEach(task => {
        const status = getStatusEmoji(task.status);
        console.log(`  ${status} ${task.description} (${task.status})`);
      });
    }

    // Show final results
    console.log('\n🎉 All tasks completed! Final results:');
    
    const finalTasks = orchestrator.getAllTasks();
    const successCount = finalTasks.filter(t => t.status === 'completed').length;
    const failureCount = finalTasks.filter(t => t.status === 'failed').length;
    
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    
    // Show agent statistics
    console.log('\n📊 Agent Performance:');
    orchestrator.getAgentStatuses().forEach(agent => {
      console.log(`  ${agent.name}:`);
      console.log(`    Tasks completed: ${agent.performance.tasksCompleted}`);
      console.log(`    Success rate: ${(agent.performance.successRate * 100).toFixed(1)}%`);
      console.log(`    Avg duration: ${agent.performance.averageTaskDuration}ms`);
    });

    // Show recent events
    console.log('\n📋 Recent Events:');
    const events = orchestrator.getEvents().slice(-10);
    events.forEach(event => {
      console.log(`  ${event.timestamp.toLocaleTimeString()} - ${event.type}`);
    });

  } catch (error) {
    console.error('❌ Error during execution:', error);
  } finally {
    // Cleanup
    console.log('\n🧹 Shutting down orchestrator...');
    await orchestrator.shutdown();
    console.log('✅ Cleanup complete');
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'completed': return '✅';
    case 'failed': return '❌';
    case 'in_progress': return '⏳';
    case 'pending': return '⏸️';
    case 'blocked': return '🚫';
    default: return '❓';
  }
}

// Advanced example: Parallel feature development
export async function parallelDevelopmentExample() {
  console.log('🚀 Advanced Example: Parallel Feature Development');

  const config = createDevelopmentConfig();
  const orchestrator = new Orchestrator(config);

  try {
    // Create multiple features simultaneously
    const features = [
      {
        name: 'LoginForm',
        description: 'User authentication form'
      },
      {
        name: 'Dashboard',
        description: 'User dashboard with analytics'
      },
      {
        name: 'Settings',
        description: 'User settings panel'
      }
    ];

    const taskIds: string[] = [];

    // Create code and test tasks for each feature
    for (const feature of features) {
      const codeTaskId = await orchestrator.createTask({
        type: 'code',
        priority: 'high',
        description: `Create ${feature.name} component`,
        dependencies: [],
        files: [
          `client/src/components/${feature.name}.tsx`
        ],
        context: {
          componentType: 'react-component',
          componentName: feature.name
        }
      });

      const testTaskId = await orchestrator.createTaskWithDependencies({
        type: 'test',
        priority: 'medium',
        description: `Generate tests for ${feature.name}`,
        dependencies: [],
        files: [
          `client/src/components/${feature.name}.test.tsx`
        ],
        context: {
          testType: 'unit',
          sourceFiles: [`client/src/components/${feature.name}.tsx`]
        }
      }, [codeTaskId]);

      taskIds.push(codeTaskId, testTaskId);
    }

    console.log(`🎯 Created ${taskIds.length} tasks for parallel execution`);

    // Monitor progress
    while (true) {
      const tasks = orchestrator.getAllTasks();
      const completedTasks = tasks.filter(t => 
        taskIds.includes(t.id) && (t.status === 'completed' || t.status === 'failed')
      );

      if (completedTasks.length === taskIds.length) {
        break;
      }

      console.log(`⏳ Progress: ${completedTasks.length}/${taskIds.length} completed`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('✅ Parallel development completed!');

  } finally {
    await orchestrator.shutdown();
  }
}

// Run the main example
if (require.main === module) {
  main().catch(console.error);
}