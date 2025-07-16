# Semantic Versioning & Release Automation

This document describes the automated semantic versioning system implemented for the AI SEO Copilot project.

## 🎯 Overview

The project uses **semantic versioning** with **conventional commits** to automatically:
- Calculate version numbers based on commit types
- Generate changelogs from commit history
- Create **draft releases** with auto-generated notes that you can edit before publishing
- Synchronize versions across all project files

## 📋 Quick Start

### Making Commits

**Option 1: Interactive Commit (Recommended)**
```bash
pnpm commit
```
This launches an interactive prompt to help you write proper conventional commits.

**Option 2: Manual Commit**
```bash
git commit -m "feat(seo): Add secondary keywords functionality"
```

### Creating Releases

**Option 1: Manual Release with Custom Notes (Recommended)**
1. Go to GitHub Actions → Manual Release workflow
2. Click "Run workflow"
3. Enter version (e.g., "2.3.3")
4. Optionally add custom release notes
5. The workflow creates a **draft release** 
6. Edit the draft release notes as needed
7. Publish when ready

**Option 2: Automated Draft Release**
- Push to main branch
- GitHub Actions automatically creates a draft release
- Edit the draft and publish manually

## 🔧 Commit Message Format

### Structure
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types
- **feat** - New feature → **MINOR** version bump
- **fix** - Bug fix → **PATCH** version bump
- **perf** - Performance improvement → **PATCH** version bump
- **docs** - Documentation → **PATCH** version bump
- **style** - Code style changes → **PATCH** version bump
- **refactor** - Code refactoring → **PATCH** version bump
- **test** - Test changes → **PATCH** version bump
- **build** - Build system changes → **PATCH** version bump
- **ci** - CI configuration → **PATCH** version bump
- **chore** - Maintenance tasks → **PATCH** version bump
- **revert** - Revert previous commit → **PATCH** version bump

### Breaking Changes
Add `BREAKING CHANGE:` in the footer or `!` after type/scope → **MAJOR** version bump

### Scopes
- **ui** - User interface changes
- **api** - API/backend changes
- **worker** - Cloudflare worker changes
- **webflow** - Webflow extension specific
- **seo** - SEO analysis features
- **auth** - Authentication
- **build** - Build system
- **deps** - Dependencies
- **config** - Configuration
- **docs** - Documentation
- **test** - Tests
- **security** - Security improvements
- **performance** - Performance improvements
- **accessibility** - Accessibility improvements

### Examples

```bash
# Feature addition (minor version bump)
feat(seo): Add secondary keywords functionality

# Bug fix (patch version bump)
fix(ui): Resolve focus border issue in Page Type Input

# Breaking change (major version bump)
feat(api)!: Change API response format

BREAKING CHANGE: API response format has changed from array to object
```

## 🤖 Automated Workflows

### Draft Release Creation
- **Trigger**: Push to main branch or manual workflow dispatch
- **Process**:
  1. Runs tests and builds project
  2. Calculates next version based on commits
  3. Generates changelog from conventional commits
  4. Creates **draft release** on GitHub
  5. Uploads bundle.zip as release asset

### Manual Release Control
- **Trigger**: Manual workflow dispatch
- **Features**:
  - Specify exact version number
  - Add custom release notes
  - Mark as pre-release if needed
  - Creates draft for final review

## 📁 Files Updated Automatically

The following files are automatically updated during releases:

- **package.json** - Main project version
- **webflow.json** - Webflow extension version
- **wrangler.toml** - Cloudflare Worker version comment
- **CHANGELOG.md** - Generated changelog

## 🛠️ Available Scripts

```bash
# Interactive commit helper
pnpm commit

# Test release without publishing
pnpm release:dry

# Generate changelog
pnpm changelog

# Update version manually
pnpm version:update 2.3.3

# Run semantic release
pnpm release
```

## 🔍 Git Hooks

### Pre-commit
- Runs TypeScript type checking
- Runs test suite
- Blocks commit if checks fail

### Commit-msg
- Validates commit message format
- Ensures conventional commit standards
- Provides helpful error messages

## 📊 Version Calculation

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `feat:` | Minor | 2.1.0 → 2.2.0 |
| `fix:` | Patch | 2.1.0 → 2.1.1 |
| `BREAKING CHANGE:` | Major | 2.1.0 → 3.0.0 |
| `docs:`, `style:`, etc. | Patch | 2.1.0 → 2.1.1 |

## 🚀 Release Workflow

### Development Flow
1. **Create feature branch**: `git checkout -b feature/new-seo-check`
2. **Make changes**: Implement your feature
3. **Commit with convention**: `pnpm commit` or manual conventional commit
4. **Push and create PR**: Normal GitHub workflow
5. **Merge to main**: Triggers automated draft release creation

### Release Flow
1. **Review draft release**: Check auto-generated notes
2. **Edit release notes**: Add custom descriptions, breaking changes, etc.
3. **Publish release**: Click "Publish release" button
4. **Deployment**: Additional deployment steps can be triggered

## 🔐 Required Secrets

Ensure these secrets are configured in your GitHub repository:

- **GITHUB_TOKEN**: Automatically available, used for creating releases
- **NPM_TOKEN**: If you plan to publish packages (optional)

## 🧪 Testing the System

### Test Commit Message Validation
```bash
# This should fail
git commit -m "bad commit message"

# This should work
git commit -m "feat(test): Add versioning system"
```

### Test Release Creation
```bash
# Dry run to test without creating release
pnpm release:dry
```

## 📖 Best Practices

### Commit Messages
- Use imperative mood: "Add feature" not "Added feature"
- Keep subject line under 72 characters
- Include scope when applicable
- Use body to explain "why" not "what"

### Release Notes
- Always review auto-generated draft releases
- Add custom notes for major features
- Include breaking change details
- Consider adding screenshots for UI changes

### Versioning Strategy
- Use semantic versioning strictly
- Breaking changes require major version bump
- New features are minor bumps
- Bug fixes are patch bumps

## 🔧 Configuration Files

- **`.releaserc.json`** - Semantic release configuration
- **`commitlint.config.js`** - Commit message validation rules
- **`.gitmessage`** - Git commit message template
- **`scripts/update-versions.js`** - Version synchronization script

## 🆘 Troubleshooting

### Common Issues

**Commit message validation fails**
- Check commit message format against examples
- Use `pnpm commit` for interactive help

**Release creation fails**
- Ensure GITHUB_TOKEN has proper permissions
- Check that main branch is up to date

**Version sync issues**
- Verify `scripts/update-versions.js` is working
- Check that all target files exist

**Pre-commit hooks fail**
- Run `pnpm check` and `pnpm test` manually
- Fix any TypeScript or test errors

### Getting Help
- Check GitHub Actions logs for detailed error messages
- Use `pnpm release:dry` to test without publishing
- Review commit history for conventional commit examples

## 🎉 Benefits

- **Consistent versioning** across all project files
- **Automated changelog** generation from commit history
- **Reduced manual errors** in release process
- **Clear release notes** with customization options
- **Enforced commit standards** for better project history
- **Automated testing** before releases
- **Draft releases** for final review before publishing