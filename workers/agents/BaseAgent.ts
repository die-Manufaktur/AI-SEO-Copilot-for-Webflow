import type { 
  AgentTask, 
  AgentCapability, 
  AgentMessage, 
  AgentStatus, 
  TaskResult, 
  AgentLock,
  FileConflict 
} from '../../shared/types/agents';

export abstract class BaseAgent {
  protected readonly id: string;
  protected readonly name: string;
  protected readonly capabilities: AgentCapability;
  protected status: AgentStatus['status'] = 'idle';
  protected currentTasks: Map<string, AgentTask> = new Map();
  protected locks: Map<string, AgentLock> = new Map();
  protected messageQueue: AgentMessage[] = [];
  
  constructor(id: string, name: string, capabilities: AgentCapability) {
    this.id = id;
    this.name = name;
    this.capabilities = capabilities;
  }

  abstract executeTask(task: AgentTask): Promise<TaskResult>;

  async processMessage(message: AgentMessage): Promise<void> {
    this.messageQueue.push(message);
    
    switch (message.type) {
      case 'task_assignment':
        await this.handleTaskAssignment(message);
        break;
      case 'status_update':
        await this.handleStatusUpdate(message);
        break;
      case 'error':
        await this.handleError(message);
        break;
      default:
        console.warn(`Unhandled message type: ${message.type}`);
    }
  }

  protected async handleTaskAssignment(message: AgentMessage): Promise<void> {
    const task = message.payload as AgentTask;
    
    if (!this.canHandleTask(task)) {
      await this.sendMessage({
        from: this.id,
        to: message.from,
        taskId: task.id,
        type: 'error',
        payload: { error: 'Task incompatible with agent capabilities' },
        timestamp: new Date(),
        priority: 'high'
      });
      return;
    }

    try {
      await this.acquireLocks(task.files, task.id);
      this.currentTasks.set(task.id, task);
      this.status = 'busy';
      
      const result = await this.executeTask(task);
      
      await this.sendMessage({
        from: this.id,
        to: message.from,
        taskId: task.id,
        type: 'task_complete',
        payload: result,
        timestamp: new Date(),
        priority: 'medium'
      });
      
    } catch (error) {
      await this.handleTaskError(task.id, error as Error);
    } finally {
      await this.releaseLocks(task.files);
      this.currentTasks.delete(task.id);
      this.status = this.currentTasks.size > 0 ? 'busy' : 'idle';
    }
  }

  protected async handleStatusUpdate(message: AgentMessage): Promise<void> {
    // Handle status updates from other agents or orchestrator
    console.log(`Status update received: ${JSON.stringify(message.payload)}`);
  }

  protected async handleError(message: AgentMessage): Promise<void> {
    console.error(`Error message received: ${JSON.stringify(message.payload)}`);
    // Implement error recovery logic
  }

  protected async handleTaskError(taskId: string, error: Error): Promise<void> {
    const task = this.currentTasks.get(taskId);
    if (!task) return;

    const result: TaskResult = {
      taskId,
      status: 'failure',
      filesModified: [],
      filesCreated: [],
      filesDeleted: [],
      errors: [error.message]
    };

    await this.sendMessage({
      from: this.id,
      to: 'orchestrator',
      taskId,
      type: 'error',
      payload: result,
      timestamp: new Date(),
      priority: 'high'
    });
  }

  protected canHandleTask(task: AgentTask): boolean {
    return this.capabilities.taskTypes.includes(task.type) &&
           task.files.some(file => 
             this.capabilities.filePatterns.some(pattern => 
               this.matchesPattern(file, pattern)
             )
           );
  }

  protected matchesPattern(filePath: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${regexPattern}$`).test(filePath);
  }

  protected async acquireLocks(files: string[], taskId: string): Promise<void> {
    for (const file of files) {
      if (this.locks.has(file)) {
        throw new Error(`File ${file} is already locked by task ${this.locks.get(file)?.taskId}`);
      }
      
      const lock: AgentLock = {
        filePath: file,
        taskId,
        agentId: this.id,
        lockType: 'write',
        acquiredAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      };
      
      this.locks.set(file, lock);
    }
  }

  protected async releaseLocks(files: string[]): Promise<void> {
    for (const file of files) {
      this.locks.delete(file);
    }
  }

  protected async sendMessage(message: AgentMessage): Promise<void> {
    // In a real implementation, this would use Redis pub/sub or message queue
    console.log(`Message sent from ${message.from} to ${message.to}:`, message);
  }

  getStatus(): AgentStatus {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      currentTasks: Array.from(this.currentTasks.keys()),
      capabilities: this.capabilities,
      lastActivity: new Date(),
      performance: {
        tasksCompleted: 0, // Would be tracked in real implementation
        averageTaskDuration: 0,
        successRate: 1.0
      }
    };
  }

  async shutdown(): Promise<void> {
    this.status = 'offline';
    await this.releaseLocks(Array.from(this.locks.keys()));
    this.currentTasks.clear();
    this.messageQueue.length = 0;
  }
}