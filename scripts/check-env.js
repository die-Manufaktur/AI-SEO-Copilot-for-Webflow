import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NODE_ENV = process.env.NODE_ENV || 'development';

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    console.log('✅ .env file found. Loading environment variables.');
    dotenv.config({ path: envPath });
} else {
    console.warn('⚠️ .env file not found! Using environment variables provided externally.');
}

// Define required variables
// These are needed regardless of environment for this app type
const requiredVars = [
    'VITE_WEBFLOW_CLIENT_ID',
    // Add any other VITE_ variables absolutely required for the build itself
    // Add any non-VITE variables required by *all* environments (e.g., maybe OPENAI_API_KEY if used during build?)
];

const missingVars = requiredVars.filter(variable => !(variable in process.env));

if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    if (fs.existsSync(envPath)) {
         console.error(`Please add them to your .env file or provide them externally.`);
    } else {
         console.error(`Please provide them as environment variables.`);
    }
    process.exit(1); // Exit with error code
}

console.log('✅ All required environment variables are present.');
// Optional: Log which variables were checked if needed for debugging
// console.log(`Checked for: ${requiredVars.join(', ')}`);