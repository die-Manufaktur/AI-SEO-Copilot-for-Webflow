import type { 
  AgentTask, 
  AgentMessage, 
  AgentStatus, 
  TaskResult, 
  TaskDependency,
  FileConflict,
  OrchestratorEvent,
  AgentConfig 
} from '../../shared/types/agents';
import { BaseAgent } from './BaseAgent';
import { CodeAgent } from './CodeAgent';
import { TestAgent } from './TestAgent';

export class Orchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private tasks: Map<string, AgentTask> = new Map();
  private dependencies: Map<string, TaskDependency> = new Map();
  private taskQueue: AgentTask[] = [];
  private completedTasks: Set<string> = new Set();
  private failedTasks: Set<string> = new Set();
  private events: OrchestratorEvent[] = [];
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Initialize Code Agent
    const codeAgent = new CodeAgent();
    this.agents.set(codeAgent.getStatus().id, codeAgent);

    // Initialize Test Agent
    const testAgent = new TestAgent();
    this.agents.set(testAgent.getStatus().id, testAgent);

    console.log(`Orchestrator initialized with ${this.agents.size} agents`);
  }

  async createTask(taskDefinition: Omit<AgentTask, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const task: AgentTask = {
      ...taskDefinition,
      id: this.generateTaskId(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(task.id, task);
    this.taskQueue.push(task);

    this.emitEvent({
      type: 'task_created',
      timestamp: new Date(),
      data: task
    });

    await this.processTaskQueue();
    return task.id;
  }

  async createTaskWithDependencies(
    taskDefinition: Omit<AgentTask, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
    dependencies: string[]
  ): Promise<string> {
    const taskId = await this.createTask(taskDefinition);
    
    if (dependencies.length > 0) {
      const dependency: TaskDependency = {
        taskId,
        dependsOn: dependencies,
        blocks: [],
        dependencyType: 'sequential'
      };
      
      this.dependencies.set(taskId, dependency);
    }

    return taskId;
  }

  async processTaskQueue(): Promise<void> {
    while (this.taskQueue.length > 0) {
      const readyTasks = this.getReadyTasks();
      
      if (readyTasks.length === 0) {
        // No tasks ready to execute, check for deadlocks
        if (this.detectDeadlock()) {
          console.error('Deadlock detected in task dependencies');
          break;
        }
        // Wait for current tasks to complete
        await this.wait(1000);
        continue;
      }

      // Process tasks in parallel up to max concurrent tasks
      const concurrentTasks = readyTasks.slice(0, this.config.orchestrator.maxConcurrentTasks);
      
      await Promise.allSettled(
        concurrentTasks.map(task => this.executeTask(task))
      );
    }
  }

  private getReadyTasks(): AgentTask[] {
    return this.taskQueue.filter(task => {
      if (task.status !== 'pending') return false;
      
      const dependency = this.dependencies.get(task.id);
      if (!dependency) return true;

      // Check if all dependencies are completed
      return dependency.dependsOn.every(depTaskId => 
        this.completedTasks.has(depTaskId)
      );
    });
  }

  private async executeTask(task: AgentTask): Promise<void> {
    try {
      // Check for file conflicts
      const conflicts = await this.detectFileConflicts(task);
      if (conflicts.length > 0) {
        await this.resolveConflicts(task, conflicts);
        return;
      }

      // Find suitable agent
      const agent = this.findSuitableAgent(task);
      if (!agent) {
        throw new Error(`No suitable agent found for task ${task.id}`);
      }

      // Update task status
      task.status = 'in_progress';
      task.assignedAgent = agent.getStatus().id;
      task.updatedAt = new Date();
      
      this.emitEvent({
        type: 'task_assigned',
        timestamp: new Date(),
        data: { taskId: task.id, agentId: agent.getStatus().id }
      });

      // Send task to agent
      const message: AgentMessage = {
        from: 'orchestrator',
        to: agent.getStatus().id,
        taskId: task.id,
        type: 'task_assignment',
        payload: task,
        timestamp: new Date(),
        priority: task.priority
      };

      await agent.processMessage(message);

      // Remove from queue
      this.taskQueue = this.taskQueue.filter(t => t.id !== task.id);

    } catch (error) {
      await this.handleTaskFailure(task, error as Error);
    }
  }

  private findSuitableAgent(task: AgentTask): BaseAgent | null {
    for (const agent of this.agents.values()) {
      const status = agent.getStatus();
      
      // Check if agent can handle this task type
      if (!status.capabilities.taskTypes.includes(task.type)) {
        continue;
      }

      // Check file pattern compatibility
      const canHandleFiles = task.files.some(file =>
        status.capabilities.filePatterns.some(pattern =>
          this.matchesGlob(file, pattern)
        )
      );

      if (!canHandleFiles) continue;

      // Check if agent is available
      if (status.currentTasks.length >= status.capabilities.maxConcurrentTasks) {
        continue;
      }

      return agent;
    }

    return null;
  }

  private async detectFileConflicts(task: AgentTask): Promise<FileConflict[]> {
    const conflicts: FileConflict[] = [];

    for (const filePath of task.files) {
      const conflictingTasks = Array.from(this.tasks.values())
        .filter(t => 
          t.status === 'in_progress' && 
          t.id !== task.id && 
          t.files.includes(filePath)
        );

      if (conflictingTasks.length > 0) {
        conflicts.push({
          filePath,
          conflictingTasks: conflictingTasks.map(t => t.id),
          conflictType: 'write_write',
          resolution: this.config.orchestrator.conflictResolutionStrategy
        });
      }
    }

    return conflicts;
  }

  private async resolveConflicts(task: AgentTask, conflicts: FileConflict[]): Promise<void> {
    for (const conflict of conflicts) {
      switch (conflict.resolution) {
        case 'queue':
          // Keep task in queue, it will be retried later
          console.log(`Task ${task.id} queued due to file conflict on ${conflict.filePath}`);
          break;
        
        case 'abort':
          await this.handleTaskFailure(task, new Error(`File conflict on ${conflict.filePath}`));
          break;
        
        case 'merge':
          // TODO: Implement merge logic for compatible changes
          console.log(`Attempting to merge changes for ${conflict.filePath}`);
          break;
      }
    }

    this.emitEvent({
      type: 'conflict_detected',
      timestamp: new Date(),
      data: { taskId: task.id, conflicts }
    });
  }

  private detectDeadlock(): boolean {
    // Simple deadlock detection: if all remaining tasks have unresolved dependencies
    const pendingTasks = this.taskQueue.filter(task => task.status === 'pending');
    
    return pendingTasks.length > 0 && pendingTasks.every(task => {
      const dependency = this.dependencies.get(task.id);
      if (!dependency) return false;
      
      return dependency.dependsOn.some(depTaskId => 
        !this.completedTasks.has(depTaskId) && !this.failedTasks.has(depTaskId)
      );
    });
  }

  async handleAgentMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case 'task_complete':
        await this.handleTaskCompletion(message);
        break;
      case 'error':
        await this.handleAgentError(message);
        break;
      case 'status_update':
        await this.handleStatusUpdate(message);
        break;
    }
  }

  private async handleTaskCompletion(message: AgentMessage): Promise<void> {
    const result = message.payload as TaskResult;
    const task = this.tasks.get(result.taskId);
    
    if (!task) return;

    task.status = 'completed';
    task.updatedAt = new Date();
    
    this.completedTasks.add(result.taskId);

    this.emitEvent({
      type: 'task_completed',
      timestamp: new Date(),
      data: { taskId: result.taskId, result }
    });

    console.log(`Task ${result.taskId} completed successfully`);

    // Process dependent tasks
    await this.processTaskQueue();
  }

  private async handleAgentError(message: AgentMessage): Promise<void> {
    const task = this.tasks.get(message.taskId);
    if (!task) return;

    await this.handleTaskFailure(task, new Error(JSON.stringify(message.payload)));
  }

  private async handleTaskFailure(task: AgentTask, error: Error): Promise<void> {
    task.status = 'failed';
    task.updatedAt = new Date();
    
    this.failedTasks.add(task.id);

    console.error(`Task ${task.id} failed:`, error.message);

    // Remove failed task from queue
    this.taskQueue = this.taskQueue.filter(t => t.id !== task.id);

    // Handle dependent tasks
    await this.handleDependentTasks(task.id);
  }

  private async handleDependentTasks(failedTaskId: string): Promise<void> {
    // Find tasks that depend on the failed task
    const dependentTasks = Array.from(this.dependencies.values())
      .filter(dep => dep.dependsOn.includes(failedTaskId));

    for (const dependency of dependentTasks) {
      const task = this.tasks.get(dependency.taskId);
      if (task && task.status === 'pending') {
        task.status = 'blocked';
        console.log(`Task ${task.id} blocked due to dependency failure`);
      }
    }
  }

  private async handleStatusUpdate(message: AgentMessage): Promise<void> {
    console.log(`Agent ${message.from} status update:`, message.payload);
  }

  getTaskStatus(taskId: string): AgentTask | null {
    return this.tasks.get(taskId) || null;
  }

  getAllTasks(): AgentTask[] {
    return Array.from(this.tasks.values());
  }

  getAgentStatuses(): AgentStatus[] {
    return Array.from(this.agents.values()).map(agent => agent.getStatus());
  }

  getEvents(): OrchestratorEvent[] {
    return [...this.events];
  }

  private emitEvent(event: OrchestratorEvent): void {
    this.events.push(event);
    
    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private matchesGlob(filePath: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${regexPattern}$`).test(filePath);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down orchestrator...');
    
    // Shutdown all agents
    await Promise.all(
      Array.from(this.agents.values()).map(agent => agent.shutdown())
    );

    // Clear state
    this.tasks.clear();
    this.taskQueue.length = 0;
    this.completedTasks.clear();
    this.failedTasks.clear();
    this.events.length = 0;

    console.log('Orchestrator shutdown complete');
  }
}