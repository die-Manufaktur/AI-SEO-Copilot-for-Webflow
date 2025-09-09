import { BaseAgent } from './BaseAgent';
import type { AgentTask, TaskResult, AgentCapability } from '../../shared/types/agents';
import * as fs from 'fs/promises';
import * as path from 'path';

export class CodeAgent extends BaseAgent {
  constructor() {
    const capabilities: AgentCapability = {
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
    };

    super('code-agent-01', 'Code Agent', capabilities);
  }

  async executeTask(task: AgentTask): Promise<TaskResult> {
    const startTime = Date.now();
    const result: TaskResult = {
      taskId: task.id,
      status: 'success',
      filesModified: [],
      filesCreated: [],
      filesDeleted: [],
      metrics: {
        duration: 0,
        linesOfCodeChanged: 0
      }
    };

    try {
      switch (task.type) {
        case 'code':
          await this.handleCodeGeneration(task, result);
          break;
        case 'refactor':
          await this.handleRefactoring(task, result);
          break;
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }

      result.metrics!.duration = Date.now() - startTime;
      result.status = 'success';

    } catch (error) {
      result.status = 'failure';
      result.errors = [error instanceof Error ? error.message : String(error)];
    }

    return result;
  }

  private async handleCodeGeneration(task: AgentTask, result: TaskResult): Promise<void> {
    const context = task.context;
    
    if (context.componentType === 'react-component') {
      await this.generateReactComponent(task, result);
    } else if (context.moduleType === 'worker-module') {
      await this.generateWorkerModule(task, result);
    } else if (context.moduleType === 'api-route') {
      await this.generateApiRoute(task, result);
    } else if (context.fileType === 'types') {
      await this.generateTypeDefinitions(task, result);
    } else {
      throw new Error('Unknown code generation type');
    }
  }

  private async handleRefactoring(task: AgentTask, result: TaskResult): Promise<void> {
    for (const filePath of task.files) {
      await this.refactorFile(filePath, task.context, result);
    }
  }

  private async generateReactComponent(task: AgentTask, result: TaskResult): Promise<void> {
    const context = task.context;
    const componentName = context.componentName as string;
    const componentPath = `client/src/components/${componentName}.tsx`;
    
    const componentCode = this.generateComponentTemplate(componentName, context);
    const testCode = this.generateComponentTestTemplate(componentName);
    
    await fs.writeFile(componentPath, componentCode, 'utf-8');
    result.filesCreated.push(componentPath);
    
    const testPath = `client/src/components/${componentName}.test.tsx`;
    await fs.writeFile(testPath, testCode, 'utf-8');
    result.filesCreated.push(testPath);
    
    result.metrics!.linesOfCodeChanged += componentCode.split('\n').length + testCode.split('\n').length;
  }

  private async generateWorkerModule(task: AgentTask, result: TaskResult): Promise<void> {
    const context = task.context;
    const moduleName = context.moduleName as string;
    const modulePath = `workers/modules/${moduleName}.ts`;
    
    const moduleCode = this.generateWorkerModuleTemplate(moduleName, context);
    
    await fs.writeFile(modulePath, moduleCode, 'utf-8');
    result.filesCreated.push(modulePath);
    
    result.metrics!.linesOfCodeChanged += moduleCode.split('\n').length;
  }

  private async generateApiRoute(task: AgentTask, result: TaskResult): Promise<void> {
    const context = task.context;
    const routeName = context.routeName as string;
    
    // Update workers/index.ts to include new route
    const indexPath = 'workers/index.ts';
    const indexContent = await fs.readFile(indexPath, 'utf-8');
    
    const routeCode = this.generateApiRouteTemplate(routeName, context);
    const updatedIndexContent = this.insertApiRoute(indexContent, routeName, routeCode);
    
    await fs.writeFile(indexPath, updatedIndexContent, 'utf-8');
    result.filesModified.push(indexPath);
    
    result.metrics!.linesOfCodeChanged += routeCode.split('\n').length;
  }

  private async generateTypeDefinitions(task: AgentTask, result: TaskResult): Promise<void> {
    const context = task.context;
    const typesFile = context.typesFile as string || 'shared/types/index.ts';
    
    const typeCode = this.generateTypeTemplate(context);
    
    const existingContent = await fs.readFile(typesFile, 'utf-8');
    const updatedContent = existingContent + '\n\n' + typeCode;
    
    await fs.writeFile(typesFile, updatedContent, 'utf-8');
    result.filesModified.push(typesFile);
    
    result.metrics!.linesOfCodeChanged += typeCode.split('\n').length;
  }

  private async refactorFile(filePath: string, context: Record<string, unknown>, result: TaskResult): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const refactoredContent = await this.applyRefactoring(content, context);
    
    if (content !== refactoredContent) {
      await fs.writeFile(filePath, refactoredContent, 'utf-8');
      result.filesModified.push(filePath);
      
      const originalLines = content.split('\n').length;
      const refactoredLines = refactoredContent.split('\n').length;
      result.metrics!.linesOfCodeChanged += Math.abs(refactoredLines - originalLines);
    }
  }

  private generateComponentTemplate(componentName: string, context: Record<string, unknown>): string {
    const props = context.props as Record<string, string> || {};
    const propsInterface = Object.keys(props).length > 0 
      ? `interface ${componentName}Props {\n${Object.entries(props).map(([key, type]) => `  ${key}: ${type};`).join('\n')}\n}\n\n`
      : '';

    return `${propsInterface}export function ${componentName}(${Object.keys(props).length > 0 ? `props: ${componentName}Props` : ''}) {
  return (
    <div className="flex items-center justify-center p-4">
      <h2 className="text-lg font-semibold">${componentName}</h2>
    </div>
  );
}`;
  }

  private generateComponentTestTemplate(componentName: string): string {
    return `import { render, screen } from '@testing-library/react';
import { ${componentName} } from './${componentName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
    expect(screen.getByText('${componentName}')).toBeInTheDocument();
  });
});`;
  }

  private generateWorkerModuleTemplate(moduleName: string, context: Record<string, unknown>): string {
    return `/**
 * ${context.description || `${moduleName} module`}
 */

export async function ${moduleName}(request: Request): Promise<Response> {
  try {
    const data = await request.json();
    
    // TODO: Implement ${moduleName} logic
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}`;
  }

  private generateApiRouteTemplate(routeName: string, context: Record<string, unknown>): string {
    return `
// ${routeName} route
app.post('/api/${routeName}', async (c) => {
  try {
    const data = await c.req.json();
    
    // TODO: Implement ${routeName} logic
    
    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});`;
  }

  private generateTypeTemplate(context: Record<string, unknown>): string {
    const interfaceName = context.interfaceName as string;
    const fields = context.fields as Record<string, string> || {};
    
    return `/**
 * ${context.description || interfaceName}
 */
export interface ${interfaceName} {
${Object.entries(fields).map(([key, type]) => `  ${key}: ${type};`).join('\n')}
}`;
  }

  private insertApiRoute(indexContent: string, routeName: string, routeCode: string): string {
    // Simple insertion at the end of routes section
    const routesEndPattern = /(?=app\.fire\(\))/;
    return indexContent.replace(routesEndPattern, routeCode + '\n\n');
  }

  private async applyRefactoring(content: string, context: Record<string, unknown>): Promise<string> {
    // Implement various refactoring operations based on context
    const refactoringType = context.refactoringType as string;
    
    switch (refactoringType) {
      case 'rename':
        return this.renameSymbol(content, context.oldName as string, context.newName as string);
      case 'extract-component':
        return this.extractComponent(content, context);
      case 'add-props':
        return this.addPropsToComponent(content, context);
      default:
        return content;
    }
  }

  private renameSymbol(content: string, oldName: string, newName: string): string {
    return content.replace(new RegExp(`\\b${oldName}\\b`, 'g'), newName);
  }

  private extractComponent(content: string, context: Record<string, unknown>): string {
    // Implement component extraction logic
    return content;
  }

  private addPropsToComponent(content: string, context: Record<string, unknown>): string {
    // Implement props addition logic
    return content;
  }
}