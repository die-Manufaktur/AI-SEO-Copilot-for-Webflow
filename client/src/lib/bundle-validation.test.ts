import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

describe('Production Bundle Validation', () => {
  const projectRoot = path.resolve(process.cwd());
  const publicDir = path.join(projectRoot, 'public');
  const bundleZip = path.join(projectRoot, 'bundle.zip');
  const tempExtractDir = path.join(projectRoot, 'temp-bundle-test');
  
  let bundleBuilt = false;
  let bundleExtracted = false;

  beforeAll(async () => {
    // Build the production bundle
    try {
      console.log('Building production bundle for validation...');
      // Clean previous builds first - use cross-platform approach
      try {
        const publicPath = path.join(projectRoot, 'public');
        const viteCachePath = path.join(projectRoot, 'node_modules', '.vite');
        
        if (fs.existsSync(publicPath)) {
          fs.rmSync(publicPath, { recursive: true, force: true });
        }
        if (fs.existsSync(viteCachePath)) {
          fs.rmSync(viteCachePath, { recursive: true, force: true });
        }
      } catch (cleanError) {
        console.warn('Clean error (ignored):', cleanError);
      }
      
      execSync('pnpm build', { 
        cwd: projectRoot, 
        stdio: 'pipe',
        env: { 
          ...process.env, 
          NODE_ENV: 'production', 
          VITE_MODE: 'production',
          // Ensure production environment variables are used
          VITE_WORKER_URL: 'https://seo-copilot-api-production.paul-130.workers.dev',
          VITE_FORCE_LOCAL_DEV: 'false'
        }
      });
      bundleBuilt = true;
      
      // Extract bundle.zip for inspection
      if (fs.existsSync(bundleZip)) {
        // Create temp directory
        if (fs.existsSync(tempExtractDir)) {
          fs.rmSync(tempExtractDir, { recursive: true, force: true });
        }
        fs.mkdirSync(tempExtractDir, { recursive: true });
        
        // Extract bundle using built-in node modules to avoid platform dependencies
        const AdmZip = await import('adm-zip').catch(() => null);
        if (AdmZip) {
          const zip = new AdmZip.default(bundleZip);
          zip.extractAllTo(tempExtractDir, true);
          bundleExtracted = true;
        } else {
          // Fallback to system unzip if available
          try {
            execSync(`unzip -o "${bundleZip}" -d "${tempExtractDir}"`, { stdio: 'pipe' });
            bundleExtracted = true;
          } catch (error) {
            console.warn('Could not extract bundle.zip for inspection:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to build production bundle:', error);
      throw new Error('Production bundle build failed - cannot run validation tests');
    }
  }, 60000); // 60 second timeout for build

  afterAll(() => {
    // Cleanup temp extraction directory
    if (fs.existsSync(tempExtractDir)) {
      try {
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Failed to cleanup temp directory:', error);
      }
    }
  });

  it('should not contain localhost references in built public directory', () => {
    expect(bundleBuilt).toBe(true);
    
    if (!fs.existsSync(publicDir)) {
      throw new Error('Public directory does not exist after build');
    }

    const localhostRefs = findLocalhostReferences(publicDir);
    
    if (localhostRefs.length > 0) {
      const errorMessage = `Found localhost references in production bundle:\n${localhostRefs.map(ref => `  ${ref.file}:${ref.line} - ${ref.content}`).join('\n')}`;
      throw new Error(errorMessage);
    }
  });

  it('should not contain localhost references in bundle.zip', () => {
    if (!bundleExtracted) {
      console.warn('Skipping bundle.zip test - could not extract bundle');
      return;
    }
    
    const localhostRefs = findLocalhostReferences(tempExtractDir);
    
    if (localhostRefs.length > 0) {
      const errorMessage = `Found localhost references in bundle.zip:\n${localhostRefs.map(ref => `  ${ref.file}:${ref.line} - ${ref.content}`).join('\n')}`;
      throw new Error(errorMessage);
    }
  });

  it('should use production worker URL in built bundle', () => {
    expect(bundleBuilt).toBe(true);
    
    const jsFiles = findJavaScriptFiles(publicDir);
    let foundProductionUrl = false;
    
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('seo-copilot-api-production.paul-130.workers.dev')) {
        foundProductionUrl = true;
        break;
      }
    }
    
    expect(foundProductionUrl).toBe(true);
  });

  it('should not contain development environment variables in bundle', () => {
    expect(bundleBuilt).toBe(true);
    
    const jsFiles = findJavaScriptFiles(publicDir);
    const devEnvVars = ['VITE_FORCE_LOCAL_DEV=true', 'localhost:8787', 'localhost:5173'];
    
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      for (const devVar of devEnvVars) {
        if (content.includes(devVar)) {
          throw new Error(`Found development environment variable '${devVar}' in production bundle: ${file}`);
        }
      }
    }
  });
});

/**
 * Recursively find all localhost references in files
 */
function findLocalhostReferences(dir: string): Array<{file: string, line: number, content: string}> {
  const references: Array<{file: string, line: number, content: string}> = [];
  
  function searchDirectory(currentDir: string) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        searchDirectory(fullPath);
      } else if (stat.isFile()) {
        // Only check text files that could contain localhost references
        const ext = path.extname(fullPath).toLowerCase();
        if (['.js', '.html', '.css', '.json', '.txt'].includes(ext)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            if (line.toLowerCase().includes('localhost')) {
              references.push({
                file: path.relative(process.cwd(), fullPath),
                line: index + 1,
                content: line.trim()
              });
            }
          });
        }
      }
    }
  }
  
  if (fs.existsSync(dir)) {
    searchDirectory(dir);
  }
  
  return references;
}

/**
 * Find all JavaScript files in a directory
 */
function findJavaScriptFiles(dir: string): string[] {
  const jsFiles: string[] = [];
  
  function searchDirectory(currentDir: string) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        searchDirectory(fullPath);
      } else if (stat.isFile() && fullPath.endsWith('.js')) {
        jsFiles.push(fullPath);
      }
    }
  }
  
  if (fs.existsSync(dir)) {
    searchDirectory(dir);
  }
  
  return jsFiles;
}