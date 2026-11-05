<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Pull Request

**This reference applies whenever files are created, modified, or deleted.**

- Apply `coding-standards` rules — review your code against them before submitting
- Use the `references/commit-creator.md` guidance for all commit messages and PR descriptions
- Keep the PR description up to date (it becomes the squash-merge commit message)
  - Write it as a plain-text conventional-commit body (see
    `references/commit-creator.md`): an optional grounded why, then `-` bullets.
    No Markdown headings (`##`), bold, fenced blocks, or checkboxes (`- [x]`) —
    they land verbatim as noise in `git log`.
- Commit and push your changes.
  - Compile and test before committing.
    - Run relevant, specific tests first for quick feedback.
    - Prefer compile-only checks for quick validation.
    - Run the project's full check/test suite before finalizing, or when
      changes affect multiple modules.
  - Keep documentation current.
    - Update `README.md` when user-facing behavior changes.
    - Update `AGENTS.md` when build processes, tools, or agent workflows change.
    - Rename a workflow or change its interface only with matching updates to
      both documents.
  - Verify required GitHub checks before returning to the user.
    - Use `log=$(mktemp /tmp/opencode/checks.XXXXXXXX); gh pr checks --watch --required >"$log" 2>&1; tail -15 "$log"`, or the MCP equivalent — the refresh table stays out of the context.
    - Fix failures before requesting review. Never return with failing checks.
- **NEVER force push.** Force pushes (`--force` and `--force-with-lease`) are **blocked by repository rules** and will always fail. If a push is rejected, do not attempt force push — create a new commit instead.
- Keep the branch synchronized with the base branch using a merge strategy.
  - Delete and regenerate lockfiles instead of merging them.
- Reply to every unresolved PR comment.
  - Leave a reply on each review comment to indicate its status.
  - If fixed: comment "Fixed" or "Done" with a brief explanation.
  - If not an issue: comment explaining why (e.g., "Not applicable because...", "Already resolved...").
  - If uncertain: ask for clarification.
  - Check thread resolution status with GraphQL `isResolved` and address only
    unresolved comments.

## Workflow

**NEVER update MERGED PRs.** If a PR is merged, create a new branch for any follow-up work.

When committing and creating/updating a PR, follow this workflow:

1. **Check current branch status** - Use MCP tools (preferred) or `gh` CLI:
   - Use `pull_request_read` or `list_pull_requests` MCP tools to check PR state
   - Or run `git status` and `gh pr view --json number,url,headRefName,state`
   - Determine: current branch, existing PR status (OPEN/CLOSED/MERGED)

2. **Ensure branch is current** — see the `using-xenoterracide-agent-skills`
   skill for full startup checks:
   - Fetch and prune: `git fetch --all --prune`
   - If the current branch has a CLOSED or MERGED PR, switch to the default branch and create a new one
   - Pull latest changes before starting work

3. **If already on a feature branch with an existing OPEN PR:**
   - Do NOT create a new branch
   - Pull latest changes first
   - Commit changes to the current branch
   - Push to update the existing PR
   - Update PR description/title if needed using `gh pr edit`

4. **If on the default branch or no PR exists for current branch:**
   - Create a new feature branch (if not already on one)
   - Commit changes
   - Push and create a new PR

5. **Before finalizing:**
   - Review if documentation needs updates (README.md, AGENTS.md)
   - Remove completed plans from `docs/superpowers/plans/`.
   - Ensure PR description accurately reflects all changes including doc updates

6. **After pushing, before returning to the user:**
   - Run `log=$(mktemp /tmp/opencode/checks.XXXXXXXX); gh pr checks --watch --required >"$log" 2>&1; tail -15 "$log"` (or MCP equivalent) to verify all required checks pass — the refresh table stays out of the context
   - If any check fails, diagnose and remediate the issue before returning
   - Do not consider the task complete while required checks are failing
   - Always print the PR URL when returning so the user can easily review
   - Stop there. Merging waits for the human's explicit confirmation.

### Self-Review Before Submitting

Before creating or updating a PR:

1. Run quality checks locally (tests, static analysis, formatting)
2. Review your own diff — would you approve this if someone else wrote it?
3. Check for obvious issues (debug prints, TODOs without tickets, unjustified suppressions)

**Fix issues yourself before requesting human review.**

## Troubleshooting

### Push rejected for workflow files

If a push is rejected with `refusing to allow ... without workflow scope`, your
base branch is usually behind `origin/develop` (a dependency bot updated a
workflow file on the remote), not an intentional workflow edit. See
`references/workflow-push-rejection.md` for the recovery steps.

### Squash Merge Strategy

This repository uses **squash merge** for PRs. This means:

- **Branch history doesn't matter** - All commits get squashed into one on merge
- **Merge is preferred over rebase** - When updating a branch with changes from develop, use `git merge origin/develop` instead of `git rebase`
- **Don't create new branches for updates** - If a PR needs changes, commit to the same branch and push
- **Don't worry about messy commits** - The squash merge cleans everything up

**When to update a branch:**

- If develop has moved forward and you need those changes: `git merge origin/develop`
- If review feedback requires changes: commit and push to same branch
- Never force push (including `--force-with-lease`) — it's unnecessary with squash merge and may be blocked by repository rules

## Creating/Updating PRs

### PR Title Format

Follow conventional commit format for PR titles (they become the squash merge commit message):

```text
<type>(<scope>): <summary>
```

- Use commit types from `git-conventional-commits.yaml` (feat, fix, docs, etc.)
- Keep title <= 72 characters
- Use specific scope when possible

### Commit Message and PR Body Format

Follow `references/commit-creator.md` for commit message format, PR
body structure, and the grounded "why" (sourced from the issue, the user's
request, or review feedback — never fabricated). PR descriptions become
permanent commit history via squash merge.

### Creating a New PR

Always provide explicit title and body. Do NOT use `--fill` as it may use the branch name instead of a proper conventional commit message.

Pass the body with `--body-file -` and a quoted heredoc. Never embed newlines in a `--body "…"` argument: `\n` inside double quotes stays literal, and the garbage lands verbatim in the PR and the squash commit.

```bash
# Get the commit message for the title
TITLE=$(git log -1 --format="%s" HEAD)

# Create PR with proper title and body
gh pr create --title "$TITLE" --body-file - <<'EOF'
- Bullet point describing change 1
- Bullet point describing change 2
EOF
```

### Updating an Existing PR

```bash
gh pr edit --title "$TITLE" --body-file - <<'EOF'
- Updated bullet points
EOF
```

## Handling Review Comments

When addressing review comments on a PR:

1. **Pull first** - Always pull the latest changes before starting
2. **Query unresolved comments** - Use MCP tools or GraphQL (see `github` skill for GraphQL examples):
   - Query review threads with `isResolved` field to find unresolved comments
   - Get thread IDs for replying
3. **Reply to each comment** - Use MCP tools or GraphQL mutation `addPullRequestReviewThreadReply` (see `github` skill):
   - Fixed: "Fixed in commit SHA"
   - Not an issue: `"Not applicable: [reason]"`
   - Question: `"Question: [clarification needed]"`
4. **Verify fixes** - Confirm changes address the current code state

**Note:** REST API doesn't expose resolved state - use GraphQL (`reviewThreads.isResolved`) or MCP tools to check unresolved comments.

## AI Attribution

Add an `Assisted-by` trailer to commit messages and PR descriptions. See
`references/commit-creator.md` for the format, placement, and rules.
