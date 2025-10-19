#!/usr/bin/env node
/**
 * Script to run only App.test.tsx tests
 */
import { spawn } from 'child_process';

const runTest = () => {
  const testProcess = spawn('pnpm', ['exec', 'vitest', 'run', 'client/src/App.test.tsx'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  testProcess.on('close', (code) => {
    console.log(`\nTest process exited with code ${code}`);
    process.exit(code);
  });

  testProcess.on('error', (error) => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
};

runTest();