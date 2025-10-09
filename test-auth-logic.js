// Simple test to verify the AuthContext error recovery logic
import { execSync } from 'child_process';

try {
  console.log('Running AuthContext tests...');
  const result = execSync('pnpm test client/src/contexts/AuthContext.test.tsx --run', {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('Test output:', result);
} catch (error) {
  console.error('Test failed with error:', error.message);
  console.error('stdout:', error.stdout);
  console.error('stderr:', error.stderr);
}