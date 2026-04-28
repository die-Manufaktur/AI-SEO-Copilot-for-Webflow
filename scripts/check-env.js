/**
 * Environment Variables Validation Script
 * Validates required environment variables for production deployment
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Required environment variables for production
const REQUIRED_ENV_VARS = [
  'WEBFLOW_CLIENT_ID',
  'WEBFLOW_CLIENT_SECRET', 
  'OAUTH_REDIRECT_URI',
  'OPENAI_API_KEY',
  'PRODUCTION_WORKER_URL'
];

// Optional environment variables with defaults
const OPTIONAL_ENV_VARS = {
  'NODE_ENV': 'production',
  'ANALYTICS_ENABLED': 'false',
  'USE_GPT_RECOMMENDATIONS': 'true',
  'ENABLE_BATCH_OPERATIONS': 'true',
  'ENABLE_ROLLBACK_FUNCTIONALITY': 'true',
  'ENABLE_CONTENT_INTELLIGENCE': 'true',
  'RATE_LIMIT_REQUESTS_PER_MINUTE': '100',
  'RATE_LIMIT_BURST_CAPACITY': '20',
  'LOG_LEVEL': 'info'
};

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...\n');

  const missingVars = [];
  const warningVars = [];
  const errors = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    
    if (!value) {
      missingVars.push(varName);
    } else {
      // Additional validation for specific variables
      if (varName === 'OAUTH_REDIRECT_URI' && !value.startsWith('https://')) {
        errors.push(`${varName} must be an HTTPS URL for security`);
      }
      
      if (varName === 'WEBFLOW_CLIENT_ID' && !value.startsWith('wf_')) {
        errors.push(`${varName} should start with 'wf_' prefix`);
      }
      
      if (varName === 'OPENAI_API_KEY' && !value.startsWith('sk-')) {
        errors.push(`${varName} should start with 'sk-' prefix`);
      }
      
      console.log(`✅ ${varName}: ${value.substring(0, 8)}...`);
    }
  }

  // Check optional variables
  for (const [varName, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    const value = process.env[varName];
    
    if (!value) {
      warningVars.push(`${varName} (will use default: ${defaultValue})`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  }

  // Report results
  console.log('\n📋 Validation Results:');
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Copy .env.example to .env and fill in your values');
  }

  if (errors.length > 0) {
    console.error('\n❌ Environment variable validation errors:');
    errors.forEach(error => {
      console.error(`   - ${error}`);
    });
  }

  if (warningVars.length > 0) {
    console.warn('\n⚠️  Optional variables using defaults:');
    warningVars.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
  }

  // Exit with appropriate code
  if (missingVars.length > 0 || errors.length > 0) {
    console.error('\n💥 Environment validation failed!');
    process.exit(1);
  } else {
    console.log('\n✅ Environment validation passed!');
    process.exit(0);
  }
}

function validateWranglerSecrets() {
  console.log('\n🔐 Checking Wrangler secrets configuration...');
  
  // Check if wrangler.toml exists
  const wranglerPath = path.resolve(__dirname, '..', 'wrangler.toml');
  if (!fs.existsSync(wranglerPath)) {
    console.error('❌ wrangler.toml not found');
    return false;
  }

  const wranglerConfig = fs.readFileSync(wranglerPath, 'utf8');
  
  // Check for required secrets in comments or docs
  console.log('📝 Required secrets to set via wrangler secret put:');
  console.log('   - WEBFLOW_CLIENT_SECRET');
  console.log('   - OPENAI_API_KEY');
  console.log('\n💡 Set these via:');
  console.log('   wrangler secret put WEBFLOW_CLIENT_SECRET');
  console.log('   wrangler secret put OPENAI_API_KEY');
  
  return true;
}

// Main execution
try {
  // Load environment variables from .env file if it exists
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file found. Loading environment variables.');
    dotenv.config({ path: envPath });
  } else {
    console.warn('⚠️ .env file not found! Using environment variables provided externally.');
  }

  checkEnvironmentVariables();
  validateWranglerSecrets();
} catch (error) {
  console.error('💥 Error during environment validation:', error.message);
  process.exit(1);
}