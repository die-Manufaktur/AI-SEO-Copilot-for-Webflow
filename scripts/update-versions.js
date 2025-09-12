#!/usr/bin/env node

/**
 * Version Update Script for AI SEO Copilot
 * 
 * This script updates version numbers across all project files to maintain
 * consistency during automated releases.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const version = process.argv[2];

if (!version) {
  console.error('❌ Version argument is required');
  process.exit(1);
}

console.log(`🔄 Updating version to ${version}...`);

// Files to update with their update patterns
const filesToUpdate = [
  {
    file: 'package.json',
    update: (content) => {
      const pkg = JSON.parse(content);
      pkg.version = version;
      return JSON.stringify(pkg, null, 2);
    }
  },
  {
    file: 'webflow.json',
    update: (content) => {
      const webflow = JSON.parse(content);
      webflow.version = version;
      return JSON.stringify(webflow, null, 2);
    }
  },
  {
    file: 'client/manifest.json',
    update: (content) => {
      const manifest = JSON.parse(content);
      manifest.version = version;
      return JSON.stringify(manifest, null, 2);
    }
  },
  {
    file: 'wrangler.toml',
    update: (content) => {
      // Add version comment to wrangler.toml for reference
      const lines = content.split('\n');
      const versionComment = `# Version: ${version}`;
      
      // Remove existing version comment if present
      const filteredLines = lines.filter(line => !line.startsWith('# Version:'));
      
      // Add new version comment at the top
      filteredLines.unshift(versionComment);
      
      return filteredLines.join('\n');
    }
  }
];

// Update each file
filesToUpdate.forEach(({ file, update }) => {
  const filePath = path.join(path.dirname(__dirname), file);
  
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const updatedContent = update(content);
      fs.writeFileSync(filePath, updatedContent + '\n');
      console.log(`✅ Updated ${file}`);
    } else {
      console.log(`⚠️  ${file} not found, skipping`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${file}:`, error.message);
    process.exit(1);
  }
});

console.log(`🎉 Successfully updated all files to version ${version}`);