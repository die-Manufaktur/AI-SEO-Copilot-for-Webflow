// Simple verification script to check if we can run the specific test
import { spawn } from 'child_process';

console.log('Testing the AuthContext error recovery...');

const testProcess = spawn('pnpm', ['test', 'client/src/contexts/AuthContext.test.tsx', '--run', '--reporter=verbose'], {
  stdio: 'pipe',
  shell: true
});

let output = '';
let errorOutput = '';

testProcess.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log(text);
});

testProcess.stderr.on('data', (data) => {
  const text = data.toString();
  errorOutput += text;
  console.error(text);
});

testProcess.on('close', (code) => {
  console.log(`\nTest process exited with code: ${code}`);
  
  if (code === 0) {
    console.log('✅ Tests passed!');
  } else {
    console.log('❌ Tests failed');
    if (output.includes('should recover from errors on retry')) {
      console.log('Test found in output');
    }
    if (output.includes('ERROR') && output.includes('UNAUTHENTICATED')) {
      console.log('Found the specific error pattern in output');
    }
  }
});