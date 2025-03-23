import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Starting dependency fix script...');

// Function to run a command and log output
const runCommand = (cmd) => {
  console.log(`Running: ${cmd}`);
  try {
    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    console.error(error.message);
    return false;
  }
};

// Backup the current yarn.lock file
if (fs.existsSync('yarn.lock')) {
  console.log('Backing up current yarn.lock file...');
  fs.copyFileSync('yarn.lock', 'yarn.lock.backup.' + Date.now());
}

// Remove node_modules and yarn.lock
console.log('Cleaning project...');
if (fs.existsSync('node_modules')) {
  try {
    fs.rmSync('node_modules', { recursive: true, force: true });
  } catch (error) {
    console.log('Could not delete node_modules folder completely, continuing anyway...');
    // For Windows, try running rimraf as a fallback
    try {
      runCommand('npx rimraf node_modules');
    } catch (e) {
      console.log('Failed to remove node_modules using rimraf, continuing anyway...');
    }
  }
}

if (fs.existsSync('yarn.lock')) {
  try {
    fs.unlinkSync('yarn.lock');
    console.log('Removed yarn.lock file');
  } catch (error) {
    console.error('Failed to remove yarn.lock:', error);
  }
}

// Clear yarn cache
console.log('Clearing yarn cache...');
runCommand('yarn cache clean');

// Update package-specific resolutions
console.log('Checking for version conflicts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Add resolutions section if needed
if (!packageJson.resolutions) {
  packageJson.resolutions = {};
}

// Add specific resolutions for known conflicts
packageJson.resolutions = {
  ...packageJson.resolutions,
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "vite": "^5.2.0",
  "@types/react": "^18.2.7",
  "js-tokens": "^4.0.0"
};

// Write updated package.json
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('Updated package.json with resolutions for known conflicts');

// Reinstall dependencies
console.log('Reinstalling dependencies...');
const installSuccess = runCommand('yarn install --force');

if (installSuccess) {
  console.log('✅ Dependencies reinstalled successfully!');
  console.log('Verifying installation...');
  // Run yarn check to verify installation
  try {
    execSync('yarn check', { stdio: 'pipe' });
    console.log('✅ Dependency check passed!');
  } catch (error) {
    const output = error.output ? error.output.toString() : '';
    const errorCount = (output.match(/error/g) || []).length;

    console.warn(`⚠️ Dependency check found ${errorCount} issues, but installation completed.`);
    console.log('Many of these issues might be non-critical. Try running your app to verify.');
  }

  console.log('Run "yarn test" to verify your testing setup works');
} else {
  console.error('❌ Failed to reinstall dependencies');

  // Restore backup if installation failed
  if (fs.existsSync('yarn.lock.backup.' + Date.now())) {
    console.log('Restoring backup yarn.lock...');
    fs.copyFileSync('yarn.lock.backup.' + Date.now(), 'yarn.lock');
    runCommand('yarn install --frozen-lockfile');
  }
}

console.log('\nIf you continue to have problems, try:');
console.log('1. Manually installing specific versions: yarn add react@18.2.0 react-dom@18.2.0');
console.log('2. Checking for incompatible peer dependencies: npm ls');
console.log('3. Using npm instead of yarn for this project: npm install');
