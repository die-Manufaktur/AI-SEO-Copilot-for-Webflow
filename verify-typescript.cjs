#!/usr/bin/env node

// Simple TypeScript verification script
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Change to project directory
process.chdir(path.dirname(__filename));

console.log('Verifying TypeScript fixes...');

// Check if setupTests.ts import is fixed
const setupTestsPath = path.join(__dirname, 'client', 'src', 'setupTests.ts');
const content = fs.readFileSync(setupTestsPath, 'utf8');

const hasCorrectImport = content.includes("import './__tests__/utils/testHelpers.tsx';");

if (hasCorrectImport) {
  console.log('✅ setupTests.ts import has been fixed');
} else {
  console.log('❌ setupTests.ts import still needs to be fixed');
}

try {
  console.log('\nRunning TypeScript check...');
  const result = execSync('pnpm check', { encoding: 'utf8', stdio: 'inherit' });
  console.log('\n✅ TypeScript check passed!');
  process.exit(0);
} catch (error) {
  console.log('\n❌ TypeScript check failed!');
  console.error('Exit code:', error.status);
  if (error.stdout) {
    console.log('STDOUT:', error.stdout.toString());
  }
  if (error.stderr) {
    console.log('STDERR:', error.stderr.toString());
  }
  process.exit(error.status || 1);
}