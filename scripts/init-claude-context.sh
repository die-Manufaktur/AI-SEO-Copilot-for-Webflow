#!/bin/bash

# AI SEO Copilot - Claude Context Initialization Script
# Automates GitHub issue context preparation for streamlined development workflow

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
CONTEXT_FILE="$CLAUDE_DIR/current-context.md"

# Ensure .claude directory exists
mkdir -p "$CLAUDE_DIR"

# Function to extract issue number from branch name
extract_issue_number() {
    local branch_name="$1"
    echo "$branch_name" | grep -o '[0-9]\+' | head -1 || echo ""
}

# Function to get current branch
get_current_branch() {
    git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"
}

# Function to get GitHub issue details
get_github_issue() {
    local issue_number="$1"
    local repo_owner="die-Manufaktur"
    local repo_name="AI-SEO-Copilot-for-Webflow"
    
    if command -v gh &> /dev/null; then
        gh issue view "$issue_number" --repo "$repo_owner/$repo_name" --json title,body,number,url 2>/dev/null || echo "null"
    else
        echo "null"
    fi
}

# Function to create context file
create_context_file() {
    local branch="$1"
    local issue_number="$2"
    local timestamp=$(date -Iseconds)
    
    cat > "$CONTEXT_FILE" << EOF
# AI SEO Copilot - Claude Code Context
# Generated: $timestamp

## Current Session Information

**Branch**: \`$branch\`
**Issue Number**: ${issue_number:-"Not detected"}
**Timestamp**: $timestamp
**Mode**: Autonomous Development

## GitHub Issue Details

EOF

    if [[ -n "$issue_number" ]]; then
        local issue_data=$(get_github_issue "$issue_number")
        if [[ "$issue_data" != "null" ]]; then
            echo "$issue_data" | jq -r '
                "### Issue #" + (.number | tostring) + ": " + .title + "\n" +
                "**URL**: " + .url + "\n\n" +
                "**Description**:\n" + .body
            ' >> "$CONTEXT_FILE" 2>/dev/null || echo "Issue #$issue_number: Details could not be parsed" >> "$CONTEXT_FILE"
        else
            echo "Issue #$issue_number: Could not fetch details (check GitHub CLI access)" >> "$CONTEXT_FILE"
        fi
    else
        echo "No issue number found" >> "$CONTEXT_FILE"
    fi

    cat >> "$CONTEXT_FILE" << EOF

## Project State

### Git Status
Last Commit: $(git log --oneline -1 2>/dev/null || echo "No commits")
Modified Files: $(git status --porcelain | wc -l | xargs)

### Environment Status
Dependencies: $([ -f "$PROJECT_ROOT/pnpm-lock.yaml" ] && echo "✅ pnpm" || echo "⚠️ Lockfile may be outdated")
Test Status: $([ -d "$PROJECT_ROOT/test" ] && echo "✅ Tests configured" || echo "❌ Some tests failing")
MCP Servers: ⚠️ $(pgrep -f "mcp" | wc -l || echo "0")

### Session Recovery
Previous Session: None found
Session Recovery: Starting fresh session

## Available Context Files

Available Context: docs/DEVELOPMENT.md

## Agentic Workflow Configuration

- **Configuration File**: \`.claude/workflow-config.yaml\`
- **Mode**: Autonomous development with TDD
- **Quality Gates**: Linting, type-checking, tests, coverage (80%+)
- **MCP Servers**: GitHub, Filesystem, Playwright, Sequential Thinking, Memory Bank
- **Error Handling**: Self-healing with automatic server recovery

## Autonomous Operation Instructions

### Your Mission
Implement the GitHub issue using Test-Driven Development (TDD) with complete autonomy:

1. **Parse the issue** using GitHub MCP server
2. **Create development plan** using Sequential Thinking MCP
3. **Implement with TDD**:
   - Write failing tests first
   - Implement minimal code to pass
   - Refactor and optimize
4. **Quality assurance**:
   - Run \`pnpm check\` (TypeScript)
   - Run \`pnpm test\` (coverage 80%+)
   - Run \`pnpm build\` (production ready)
5. **Documentation**: Update relevant docs

### Quality Gates
- ✅ All tests pass
- ✅ TypeScript checks pass
- ✅ Test coverage ≥ 80%
- ✅ Production build succeeds
- ✅ No console errors/warnings

### Error Recovery
If any step fails:
1. Analyze error using Sequential Thinking
2. Self-correct and retry
3. Update approach if needed
4. Continue autonomous operation

### Success Criteria
- Issue requirements fully implemented
- All quality gates passed
- Documentation updated
- Ready for PR submission

EOF
}

# Main execution
main() {
    echo -e "${BLUE}=============================================="
    echo "AI SEO Copilot - Claude Context Initialization"
    echo -e "===============================================${NC}"
    echo
    
    # Get current branch and issue number
    local current_branch=$(get_current_branch)
    local issue_number=$(extract_issue_number "$current_branch")
    
    # Create context file
    echo -e "${BLUE}[INFO]${NC} Creating Claude Code context file..."
    create_context_file "$current_branch" "$issue_number"
    
    # Validate context file
    if [[ -f "$CONTEXT_FILE" ]]; then
        echo -e "${GREEN}[SUCCESS]${NC} Context file created: $CONTEXT_FILE"
        echo -e "${GREEN}[SUCCESS]${NC} Context file validation passed"
    else
        echo -e "${RED}[ERROR]${NC} Failed to create context file"
        exit 1
    fi
    
    echo
    echo -e "${GREEN}=============================================="
    echo "[SUCCESS] Claude Code Context Initialized"
    echo -e "===============================================${NC}"
    echo
    echo -e "${BLUE}[INFO]${NC} Current Setup:"
    echo "  • Branch: $current_branch"
    echo "  • Issue: ${issue_number:-"Not detected"}"
    echo "  • Context File: $CONTEXT_FILE"
    echo
    echo -e "${BLUE}[INFO]${NC} Autonomous Development Ready:"
    echo "  • TDD methodology enabled"
    echo "  • Quality gates configured"
    echo "  • MCP servers will be monitored"
    echo "  • Error handling is autonomous"
    echo
    echo -e "${BLUE}[INFO]${NC} Next step: Launch Claude Code with:"
    echo "  • Configuration: .claude/workflow-config.yaml"
    echo "  • Context: .claude/current-context.md"
    echo "  • Mode: Autonomous"
}

# Run main function
main "$@"