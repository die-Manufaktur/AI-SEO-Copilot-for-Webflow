// Script to check that required environment variables are set before building
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Determine if this is a production build
const isProduction = process.env.NODE_ENV === 'production';

// Check if .env file exists
if (!fs.existsSync(path.join(rootDir, '.env'))) {
  console.error('❌ .env file not found! Using environment variables only.');
  // In development, we'll continue anyway
  if (!isProduction) {
    console.log('✅ Development mode - continuing without .env file');
    process.exit(0);
  }
}

// Read .env file if it exists
let envVars = {};
try {
  if (fs.existsSync(path.join(rootDir, '.env'))) {
    const envFile = fs.readFileSync(path.join(rootDir, '.env'), 'utf8');
    
    // Extract variables from .env file
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        envVars[key] = value;
      }
    });
  }

  // Also check process.env variables
  envVars = { ...envVars, ...process.env };
  
  // Required variables for production build
  const requiredVars = [
    'VITE_WEBFLOW_API_KEY',
    'VITE_WEBFLOW_SITE_ID', 
    'VITE_WEBFLOW_CLIENT_ID',
    'WEBFLOW_CLIENT_SECRET',
    'WEBFLOW_REDIRECT_URI'
  ];

  // Skip check in development mode if values are missing
  if (!isProduction) {
    console.log('⚠️ Development mode - skipping strict environment variable check');
    process.exit(0);
  }

  // Check each required variable for production
  let missingVars = [];
  requiredVars.forEach(varName => {
    if (!envVars[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please add them to your .env file before building');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set');
  process.exit(0);
} catch (error) {
  console.error(`❌ Error checking environment variables: ${error.message}`);
  if (!isProduction) {
    console.log('✅ Development mode - continuing despite error');
    process.exit(0);
  }
  process.exit(1);
}
