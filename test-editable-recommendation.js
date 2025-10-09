#!/usr/bin/env node

/**
 * Quick test script to verify EditableRecommendation test fixes
 * Run with: node test-editable-recommendation.js
 */

const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing EditableRecommendation component fixes...\n');

try {
  // Change to project directory
  process.chdir(path.join(__dirname));
  
  console.log('📍 Current directory:', process.cwd());
  
  // Run the specific test file
  const testCommand = 'pnpm test -- client/src/components/ui/editable-recommendation.test.tsx';
  
  console.log('🚀 Running command:', testCommand);
  console.log('⏳ This may take a moment...\n');
  
  const output = execSync(testCommand, { 
    encoding: 'utf8', 
    stdio: 'pipe',
    timeout: 60000 // 60 second timeout
  });
  
  console.log('✅ Test output:');
  console.log(output);
  
} catch (error) {
  console.error('❌ Test execution failed:');
  console.error('Error code:', error.status);
  console.error('Error message:', error.message);
  
  if (error.stdout) {
    console.log('\n📤 STDOUT:');
    console.log(error.stdout);
  }
  
  if (error.stderr) {
    console.error('\n📥 STDERR:');
    console.error(error.stderr);
  }
  
  // Try to identify specific issues
  const errorOutput = (error.stdout || '') + (error.stderr || '');
  
  if (errorOutput.includes('offset out of bounds')) {
    console.log('\n🔍 ANALYSIS: Still seeing "offset out of bounds" errors');
    console.log('   This suggests text selection issues with userEvent');
    console.log('   Recommendation: Use more fireEvent instead of userEvent for text interactions');
  }
  
  if (errorOutput.includes('TypeError')) {
    console.log('\n🔍 ANALYSIS: TypeScript/JavaScript error detected');
    console.log('   Check for missing mocks or incorrect imports');
  }
  
  if (errorOutput.includes('timeout')) {
    console.log('\n🔍 ANALYSIS: Test timeout detected');
    console.log('   Consider adding more waitFor() calls or increasing timeouts');
  }
  
  process.exit(1);
}

console.log('\n🎉 All tests passed! The EditableRecommendation component fixes are working.');