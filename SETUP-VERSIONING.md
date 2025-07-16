# 🚀 Semantic Versioning Setup Guide

## ✅ What's Been Implemented

Your AI SEO Copilot project now has a complete semantic versioning automation system with the following features:

### 🎯 Key Features
- **Draft Releases**: Auto-generated releases that you can edit before publishing
- **Conventional Commits**: Enforced commit message standards
- **Automated Version Sync**: Updates package.json, webflow.json, and wrangler.toml
- **Interactive Commits**: Helper for writing proper commit messages
- **Automated Changelog**: Generated from commit history
- **Git Hooks**: Pre-commit validation and testing

### 📦 Components Installed

**Core Dependencies:**
- `semantic-release` - Main release automation
- `@semantic-release/git` - Git integration
- `@semantic-release/changelog` - Changelog generation
- `@semantic-release/github` - GitHub releases
- `@semantic-release/exec` - Custom script execution
- `conventional-changelog-conventionalcommits` - Changelog formatting

**Commit Validation:**
- `@commitlint/config-conventional` - Commit message rules
- `@commitlint/cli` - Commit message validation
- `husky` - Git hooks
- `commitizen` - Interactive commit helper
- `cz-conventional-changelog` - Conventional commit prompts

## 🔧 Setup Instructions

### 1. Initialize Git Hooks
```bash
# This should already be done via the "prepare" script
pnpm install
```

### 2. Configure Git (Optional)
```bash
# Set commit message template
git config --local commit.template .gitmessage

# Configure VS Code as commit editor (optional)
git config --local core.editor "code --wait"
```

### 3. Test the System
```bash
# Test commit message validation
pnpm commit

# Test dry run release
pnpm release:dry

# Test version update script
pnpm version:update 2.3.4
```

## 🎬 How to Use

### Making Commits

**Method 1: Interactive Helper (Recommended)**
```bash
pnpm commit
```
This will guide you through creating a proper conventional commit.

**Method 2: Manual Conventional Commits**
```bash
git commit -m "feat(ui): Add new SEO analysis dashboard"
git commit -m "fix(api): Resolve keyword analysis bug"
git commit -m "docs: Update README with new features"
```

### Creating Releases

**Method 1: Manual Release (Recommended)**
1. Go to GitHub Actions → "Manual Release"
2. Click "Run workflow"
3. Enter version: `2.3.4`
4. Optionally add custom release notes
5. Click "Run workflow"
6. Review the draft release created
7. Edit release notes as needed
8. Publish the release

**Method 2: Automated Draft Release**
1. Push commits to main branch
2. GitHub Actions automatically creates draft release
3. Edit and publish manually

## 📁 Files Created/Modified

### New Files
- `.releaserc.json` - Semantic release configuration
- `commitlint.config.js` - Commit message validation rules
- `.gitmessage` - Git commit message template
- `scripts/update-versions.js` - Version synchronization script
- `.github/workflows/release.yml` - Automated release workflow
- `.github/workflows/manual-release.yml` - Manual release workflow
- `.husky/commit-msg` - Commit message validation hook
- `.husky/pre-commit` - Pre-commit testing hook
- `VERSIONING.md` - Comprehensive documentation

### Modified Files
- `package.json` - Added scripts and dependencies
- `webflow.json` - Updated to version 2.3.3
- `wrangler.toml` - Added version comment

## 🔑 Required GitHub Secrets

The system uses the default `GITHUB_TOKEN` which is automatically available in GitHub Actions. No additional secrets are required for basic functionality.

## 🧪 Testing Your Setup

### 1. Test Commit Validation
```bash
# This should fail with helpful message
git commit -m "bad commit message"

# This should work
git commit -m "test(setup): Verify commit validation works"
```

### 2. Test Version Update
```bash
# Update to a test version
pnpm version:update 2.3.4

# Check that files were updated
git diff
```

### 3. Test Release (Dry Run)
```bash
# Test without creating actual release
pnpm release:dry
```

## 📖 Workflow Examples

### Adding a New Feature
```bash
# 1. Create feature branch
git checkout -b feature/advanced-seo-insights

# 2. Make changes
# ... code changes ...

# 3. Commit with conventional format
pnpm commit
# Choose: feat
# Scope: seo
# Description: Add advanced SEO insights dashboard

# 4. Push and create PR
git push origin feature/advanced-seo-insights

# 5. Merge to main (triggers draft release)
```

### Releasing to Production
```bash
# 1. Go to GitHub Actions → Manual Release
# 2. Run workflow with version 2.4.0
# 3. Add custom release notes:
#    "This release introduces advanced SEO insights with real-time analysis..."
# 4. Review draft release
# 5. Edit notes as needed
# 6. Publish release
```

## 🔄 Version Bump Rules

| Commit Type | Example | Version Change |
|-------------|---------|----------------|
| `feat:` | `feat(ui): Add new dashboard` | 2.3.3 → 2.4.0 |
| `fix:` | `fix(api): Resolve bug` | 2.3.3 → 2.3.4 |
| `BREAKING CHANGE:` | `feat!: Change API format` | 2.3.3 → 3.0.0 |
| `docs:` | `docs: Update README` | 2.3.3 → 2.3.4 |

## 🎯 Benefits You'll See

1. **Consistent Versioning**: All files stay in sync automatically
2. **Better Commit History**: Enforced conventional commits
3. **Automated Changelogs**: Generated from commit messages
4. **Quality Control**: Pre-commit hooks prevent broken releases
5. **Custom Release Notes**: Edit auto-generated drafts before publishing
6. **Reduced Errors**: Automation prevents manual mistakes
7. **Clear Release Process**: Standardized workflow for all releases

## 🔧 Customization Options

### Modify Commit Scopes
Edit `commitlint.config.js` to add/remove allowed scopes:
```javascript
'scope-enum': [
  2,
  'always',
  [
    'ui', 'api', 'worker', 'webflow', 'seo', 'auth', 'build', 'deps', 'config'
    // Add your custom scopes here
  ]
]
```

### Adjust Release Configuration
Edit `.releaserc.json` to modify:
- Which files get updated
- Release note format
- Asset uploads
- Plugin configuration

### Modify Git Hooks
Edit `.husky/pre-commit` to change what runs before commits:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Add your custom checks here
pnpm check
pnpm test
```

## 🆘 Troubleshooting

### Common Issues

**"Husky command not found"**
```bash
pnpm install
```

**"Release creation failed"**
- Check GitHub Actions logs
- Verify GITHUB_TOKEN permissions
- Ensure main branch is up to date

**"Tests failing on commit"**
```bash
# Fix tests first
pnpm test
pnpm check

# Then commit
pnpm commit
```

### Getting Help

1. Check `VERSIONING.md` for detailed usage
2. Review GitHub Actions logs for errors
3. Use `pnpm release:dry` to test without publishing
4. Test individual components with provided scripts

## 🎉 Next Steps

1. **Test the system** with a few commits
2. **Create your first release** using the manual workflow
3. **Customize** scopes and rules as needed
4. **Train your team** on the new workflow
5. **Monitor** the automated releases and adjust as needed

Your semantic versioning system is now ready to use! 🚀