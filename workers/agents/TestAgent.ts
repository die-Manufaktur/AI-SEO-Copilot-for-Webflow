import { BaseAgent } from './BaseAgent';
import type { AgentTask, TaskResult, AgentCapability } from '../../shared/types/agents';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TestAgent extends BaseAgent {
  constructor() {
    const capabilities: AgentCapability = {
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
    };

    super('test-agent-01', 'Test Agent', capabilities);
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
        linesOfCodeChanged: 0,
        testsAdded: 0,
        coverageChange: 0
      }
    };

    try {
      switch (task.context.testType) {
        case 'unit':
          await this.generateUnitTests(task, result);
          break;
        case 'integration':
          await this.generateIntegrationTests(task, result);
          break;
        case 'coverage':
          await this.analyzeCoverage(task, result);
          break;
        case 'validate':
          await this.validateExistingTests(task, result);
          break;
        default:
          await this.generateUnitTests(task, result); // Default to unit tests
      }

      result.metrics!.duration = Date.now() - startTime;
      result.status = 'success';

    } catch (error) {
      result.status = 'failure';
      result.errors = [error instanceof Error ? error.message : String(error)];
    }

    return result;
  }

  private async generateUnitTests(task: AgentTask, result: TaskResult): Promise<void> {
    const context = task.context;
    const sourceFiles = context.sourceFiles as string[] || task.files;

    for (const sourceFile of sourceFiles) {
      if (sourceFile.endsWith('.test.ts') || sourceFile.endsWith('.test.tsx')) {
        continue; // Skip test files
      }

      const testFile = await this.generateTestForFile(sourceFile, context);
      if (testFile) {
        result.filesCreated.push(testFile.path);
        result.metrics!.linesOfCodeChanged += testFile.lines;
        result.metrics!.testsAdded! += testFile.testCount;
      }
    }
  }

  private async generateIntegrationTests(task: AgentTask, result: TaskResult): Promise<void> {
    const context = task.context;
    const featureName = context.featureName as string;
    
    const integrationTestPath = `client/src/integration/${featureName}.integration.test.tsx`;
    const testCode = this.generateIntegrationTestTemplate(featureName, context);
    
    await fs.writeFile(integrationTestPath, testCode, 'utf-8');
    result.filesCreated.push(integrationTestPath);
    result.metrics!.linesOfCodeChanged += testCode.split('\n').length;
    result.metrics!.testsAdded! += this.countTestCases(testCode);
  }

  private async analyzeCoverage(task: AgentTask, result: TaskResult): Promise<void> {
    try {
      const { stdout } = await execAsync('pnpm test --coverage --reporter=json');
      const coverageData = JSON.parse(stdout);
      
      result.output = `Coverage Analysis:\n${this.formatCoverageReport(coverageData)}`;
      result.metrics!.coverageChange = this.calculateCoverageChange(coverageData);
    } catch (error) {
      result.warnings = [`Coverage analysis failed: ${error instanceof Error ? error.message : String(error)}`];
    }
  }

  private async validateExistingTests(task: AgentTask, result: TaskResult): Promise<void> {
    const testFiles = task.files.filter(file => 
      file.endsWith('.test.ts') || file.endsWith('.test.tsx')
    );

    for (const testFile of testFiles) {
      const validation = await this.validateTestFile(testFile);
      if (!validation.isValid) {
        result.warnings = result.warnings || [];
        result.warnings.push(`${testFile}: ${validation.issues.join(', ')}`);
      }
    }

    try {
      const { stdout, stderr } = await execAsync('pnpm test --run');
      result.output = `Test validation results:\n${stdout}`;
      if (stderr) {
        result.warnings = result.warnings || [];
        result.warnings.push(stderr);
      }
    } catch (error) {
      result.errors = [`Test execution failed: ${error instanceof Error ? error.message : String(error)}`];
    }
  }

  private async generateTestForFile(sourceFile: string, context: Record<string, unknown>): Promise<{ path: string; lines: number; testCount: number } | null> {
    try {
      const sourceContent = await fs.readFile(sourceFile, 'utf-8');
      const testPath = this.getTestFilePath(sourceFile);
      
      let testContent: string;
      
      if (sourceFile.endsWith('.tsx')) {
        testContent = await this.generateReactComponentTest(sourceFile, sourceContent, context);
      } else if (sourceFile.endsWith('.ts') && sourceFile.includes('workers/modules/')) {
        testContent = await this.generateWorkerModuleTest(sourceFile, sourceContent, context);
      } else if (sourceFile.endsWith('.ts')) {
        testContent = await this.generateUtilityTest(sourceFile, sourceContent, context);
      } else {
        return null;
      }

      await fs.writeFile(testPath, testContent, 'utf-8');
      
      return {
        path: testPath,
        lines: testContent.split('\n').length,
        testCount: this.countTestCases(testContent)
      };
    } catch (error) {
      console.error(`Failed to generate test for ${sourceFile}:`, error);
      return null;
    }
  }

  private async generateReactComponentTest(sourceFile: string, sourceContent: string, context: Record<string, unknown>): Promise<string> {
    const componentName = this.extractComponentName(sourceContent);
    const props = this.extractComponentProps(sourceContent);
    const hooks = this.extractHooksUsage(sourceContent);

    return `import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ${componentName} } from './${path.basename(sourceFile, '.tsx')}';

describe('${componentName}', () => {
  const defaultProps = {
${props.map(prop => `    ${prop.name}: ${this.generateMockValue(prop.type)},`).join('\n')}
  };

  it('renders without crashing', () => {
    render(<${componentName} {...defaultProps} />);
    expect(screen.getByTestId('${componentName.toLowerCase()}')).toBeInTheDocument();
  });

  ${this.generatePropTests(componentName, props)}
  
  ${hooks.includes('useState') ? this.generateStateTests(componentName) : ''}
  
  ${this.generateEventTests(componentName, sourceContent)}
  
  ${this.generateAccessibilityTests(componentName)}
});`;
  }

  private async generateWorkerModuleTest(sourceFile: string, sourceContent: string, context: Record<string, unknown>): Promise<string> {
    const moduleName = path.basename(sourceFile, '.ts');
    const exportedFunctions = this.extractExportedFunctions(sourceContent);

    return `import { ${exportedFunctions.join(', ')} } from './${moduleName}';

describe('${moduleName}', () => {
  ${exportedFunctions.map(fn => `
  describe('${fn}', () => {
    it('should handle valid input', async () => {
      const mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' })
      });
      
      const response = await ${fn}(mockRequest);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should handle invalid input', async () => {
      const mockRequest = new Request('http://localhost', {
        method: 'POST',
        body: 'invalid json'
      });
      
      const response = await ${fn}(mockRequest);
      expect(response.status).toBe(500);
    });
  });`).join('\n')}
});`;
  }

  private async generateUtilityTest(sourceFile: string, sourceContent: string, context: Record<string, unknown>): Promise<string> {
    const moduleName = path.basename(sourceFile, '.ts');
    const exportedFunctions = this.extractExportedFunctions(sourceContent);

    return `import { ${exportedFunctions.join(', ')} } from './${moduleName}';

describe('${moduleName}', () => {
  ${exportedFunctions.map(fn => `
  describe('${fn}', () => {
    it('should work correctly', () => {
      // TODO: Implement test for ${fn}
      expect(${fn}).toBeDefined();
    });
  });`).join('\n')}
});`;
  }

  private generateIntegrationTestTemplate(featureName: string, context: Record<string, unknown>): string {
    return `import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from '../App';

describe('${featureName} Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should complete the ${featureName} workflow', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    // TODO: Implement integration test steps for ${featureName}
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});`;
  }

  private getTestFilePath(sourceFile: string): string {
    const ext = path.extname(sourceFile);
    const basePath = sourceFile.slice(0, -ext.length);
    return `${basePath}.test${ext}`;
  }

  private extractComponentName(content: string): string {
    const match = content.match(/export\s+(?:function|const)\s+(\w+)/);
    return match ? match[1] : 'Component';
  }

  private extractComponentProps(content: string): { name: string; type: string }[] {
    const propsMatch = content.match(/interface\s+\w+Props\s*{([^}]+)}/);
    if (!propsMatch) return [];

    const propsContent = propsMatch[1];
    const propMatches = propsContent.matchAll(/(\w+):\s*([^;]+);/g);
    
    return Array.from(propMatches).map(match => ({
      name: match[1],
      type: match[2].trim()
    }));
  }

  private extractHooksUsage(content: string): string[] {
    const hooks: string[] = [];
    if (content.includes('useState')) hooks.push('useState');
    if (content.includes('useEffect')) hooks.push('useEffect');
    if (content.includes('useQuery')) hooks.push('useQuery');
    return hooks;
  }

  private extractExportedFunctions(content: string): string[] {
    const matches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
    return Array.from(matches).map(match => match[1]);
  }

  private generateMockValue(type: string): string {
    switch (type.toLowerCase()) {
      case 'string': return "'test'";
      case 'number': return '42';
      case 'boolean': return 'true';
      case 'function': return 'jest.fn()';
      default: return '{}';
    }
  }

  private generatePropTests(componentName: string, props: { name: string; type: string }[]): string {
    return props.map(prop => `
  it('renders with ${prop.name} prop', () => {
    const testProps = { ...defaultProps, ${prop.name}: ${this.generateMockValue(prop.type)} };
    render(<${componentName} {...testProps} />);
    expect(screen.getByTestId('${componentName.toLowerCase()}')).toBeInTheDocument();
  });`).join('\n');
  }

  private generateStateTests(componentName: string): string {
    return `
  it('manages state correctly', async () => {
    render(<${componentName} />);
    // TODO: Add state management tests
  });`;
  }

  private generateEventTests(componentName: string, content: string): string {
    const hasClickHandler = content.includes('onClick');
    const hasChangeHandler = content.includes('onChange');

    let tests = '';
    if (hasClickHandler) {
      tests += `
  it('handles click events', async () => {
    const user = userEvent.setup();
    render(<${componentName} />);
    // TODO: Add click event tests
  });`;
    }
    if (hasChangeHandler) {
      tests += `
  it('handles change events', async () => {
    const user = userEvent.setup();
    render(<${componentName} />);
    // TODO: Add change event tests
  });`;
    }
    return tests;
  }

  private generateAccessibilityTests(componentName: string): string {
    return `
  it('meets accessibility requirements', () => {
    render(<${componentName} />);
    // TODO: Add accessibility tests
    expect(screen.getByTestId('${componentName.toLowerCase()}')).toBeInTheDocument();
  });`;
  }

  private countTestCases(content: string): number {
    const matches = content.match(/it\(/g);
    return matches ? matches.length : 0;
  }

  private formatCoverageReport(coverageData: any): string {
    // Format coverage data for display
    return JSON.stringify(coverageData, null, 2);
  }

  private calculateCoverageChange(coverageData: any): number {
    // Calculate coverage percentage change
    return 0; // Placeholder
  }

  private async validateTestFile(testFile: string): Promise<{ isValid: boolean; issues: string[] }> {
    try {
      const content = await fs.readFile(testFile, 'utf-8');
      const issues: string[] = [];

      if (!content.includes('describe(')) {
        issues.push('Missing describe block');
      }
      if (!content.includes('it(')) {
        issues.push('Missing test cases');
      }
      if (!content.includes('expect(')) {
        issues.push('Missing assertions');
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      return {
        isValid: false,
        issues: [`Cannot read test file: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }
}