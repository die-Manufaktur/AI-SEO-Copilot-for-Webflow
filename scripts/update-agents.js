import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const agentsDir = path.join(__dirname, '..', '.claude', 'agents');

// Common tools all agents should have access to
const commonTools = [
  'Read',
  'Write',
  'Edit',
  'MultiEdit',
  'Glob',
  'Grep',
  'Bash',
  'Task',
  'WebSearch',
  'WebFetch'
];

// MCP server wildcard permissions
const mcpPermissions = [
  'mcp__github__*',
  'mcp__webflow__*',
  'mcp__Context7__*',
  'mcp__serena__*',
  'mcp__filesystem__*',
  'mcp__git__*',
  'mcp__sequentialthinking__*',
  'mcp__test-stats-scout__*',
  'mcp__chrome-devtools__*',
  'mcp__memory__*',
  'mcp__plugin_episodic-memory_episodic-memory__*',
  'mcp__mcp-compass__*'
];

function updateAgent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Split frontmatter and content
  const parts = content.split('---');
  if (parts.length < 3) {
    console.log(`⚠️  Skipping ${path.basename(filePath)}: Invalid frontmatter`);
    return;
  }

  const frontmatter = parts[1];
  const bodyContent = parts.slice(2).join('---');

  // Parse frontmatter
  const lines = frontmatter.split('\n').filter(line => line.trim());
  const metadata = {};
  let currentKey = null;
  let currentValue = [];

  for (const line of lines) {
    if (line.match(/^[a-z_]+:/)) {
      // Save previous key-value
      if (currentKey) {
        metadata[currentKey] = currentValue.join('\n').trim();
      }

      // Start new key-value
      const colonIndex = line.indexOf(':');
      currentKey = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      currentValue = value ? [value] : [];
    } else if (currentKey) {
      currentValue.push(line);
    }
  }

  // Save last key-value
  if (currentKey) {
    metadata[currentKey] = currentValue.join('\n').trim();
  }

  // Update model
  metadata.model = 'opus';

  // Get existing tools
  const existingTools = metadata.tools ? metadata.tools.split(',').map(t => t.trim()) : [];

  // Merge with common tools (avoid duplicates)
  const allTools = [...new Set([...existingTools, ...commonTools])];
  metadata.tools = allTools.join(', ');

  // Add MCP permissions
  metadata.mcpServers = mcpPermissions.join(', ');

  // Reconstruct frontmatter
  const newFrontmatter = [];
  newFrontmatter.push('name: ' + metadata.name);

  // Handle multiline description
  if (metadata.description.includes('\n')) {
    newFrontmatter.push('description: |');
    metadata.description.split('\n').forEach(line => {
      newFrontmatter.push('  ' + line);
    });
  } else {
    newFrontmatter.push('description: ' + metadata.description);
  }

  if (metadata.color) {
    newFrontmatter.push('color: ' + metadata.color);
  }

  newFrontmatter.push('model: ' + metadata.model);
  newFrontmatter.push('tools: ' + metadata.tools);
  newFrontmatter.push('mcpServers: ' + metadata.mcpServers);

  // Reconstruct file
  const newContent = '---\n' + newFrontmatter.join('\n') + '\n---' + bodyContent;

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✅ Updated ${path.basename(filePath)}`);
}

// Process all agent files
const files = fs.readdirSync(agentsDir);
console.log(`Found ${files.length} agent files\n`);

for (const file of files) {
  if (file.endsWith('.md')) {
    const filePath = path.join(agentsDir, file);
    try {
      updateAgent(filePath);
    } catch (error) {
      console.error(`❌ Error updating ${file}:`, error.message);
    }
  }
}

console.log('\n✨ Agent updates complete!');
