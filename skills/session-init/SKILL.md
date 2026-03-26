---
name: session-init
description: ALWAYS use this skill at the start of EVERY new session before any other work. This skill is always consumed first. Use when beginning work in a repository to verify the current branch state and ensure you're working from a clean, up-to-date foundation.
# SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
#
# SPDX-License-Identifier: CC-BY-NC-SA-4.0
---

# Session Initialization

**CRITICAL: Run these checks IMMEDIATELY at session start, BEFORE any other actions.**

When starting a new session, always verify the current repository state to avoid:
- Working on a branch with a CLOSED or MERGED PR
- Investigating code that doesn't include recent fixes
- Addressing review comments on outdated code

## Mandatory Startup Checks

Run these commands **first** before any investigation or code changes:

```bash
# 1. Check current branch and git status
git status

# 2. Check if current branch has a PR and its state
gh pr view --json number,url,headRefName,state,baseRefName

# 3. Get the default branch name (usually develop or main)
git remote show origin | grep "HEAD branch" | cut -d" " -f5
```

## Decision Matrix

Based on the PR state, take action BEFORE proceeding:

### Case 1: No PR exists (or command fails)
```bash
# Switch to default branch and pull latest
git checkout develop  # or main
git pull origin develop
```
Then proceed with new work.

### Case 2: PR is OPEN
```bash
# Pull latest from base branch to ensure you have current state
git pull origin develop  # or whatever the baseRefName is
```
Then proceed with work on the existing branch.

### Case 3: PR is CLOSED or MERGED
```bash
# The branch is stale - switch to default and clean up
git checkout develop
git branch -D <old-branch-name>  # delete the stale branch
git pull origin develop
```
Then create a fresh branch for new work.

## Complete Startup Script

Use this as a reference for session initialization logic:

```bash
#!/bin/bash
# Always run this first on session start

echo "=== Session Initialization ==="

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# Check for PR state
PR_INFO=$(gh pr view --json number,state,baseRefName 2>/dev/null || echo "null")

if [ "$PR_INFO" = "null" ]; then
    echo "No PR found for current branch"
    
    # Ensure we're on default branch with latest
    git checkout develop 2>/dev/null || git checkout main
    git pull origin $(git branch --show-current)
else
    PR_STATE=$(echo $PR_INFO | jq -r '.state')
    BASE_BRANCH=$(echo $PR_INFO | jq -r '.baseRefName')
    
    echo "PR state: $PR_STATE"
    
    if [ "$PR_STATE" = "OPEN" ]; then
        echo "PR is open - pulling latest from $BASE_BRANCH"
        git pull origin $BASE_BRANCH
        echo "Ready to continue work on existing PR"
    else
        echo "PR is $PR_STATE - branch is stale, switching to $BASE_BRANCH"
        git checkout $BASE_BRANCH
        git branch -D $CURRENT_BRANCH 2>/dev/null || true
        git pull origin $BASE_BRANCH
        echo "Ready for new work on fresh branch"
    fi
fi
```

## Key Principle

**Never investigate issues or start coding without first knowing your branch state.**

The few seconds spent on these checks prevents:
- Wasted time investigating already-fixed bugs
- Confusion from working on merged PRs
- Merge conflicts from stale branches
- Duplicate work from outdated codebases

---

SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
