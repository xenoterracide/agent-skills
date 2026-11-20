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
- Commit and push each completed logical step. Do not hold the work for one
  commit at the end.
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
  - Settle checks with `ghb pr verify` before returning to the user.
    - Run it on the draft, then again after `gh pr ready`. Fix failures at
      either step. Never return with failing checks.
    - Notify the human with `[repo#NNN](url)`.
- **NEVER force push.** Force pushes (`--force` and `--force-with-lease`) are **blocked by repository rules** and will always fail. If a push is rejected, do not attempt force push — create a new commit instead.
- Keep the branch synchronized with the base branch.
  - Routine sync is `ghb pr sync` — it merges the default branch, pushes,
    and prints one line. Without ghb, follow `references/manual-sync.md`.
  - Delete and regenerate lockfiles instead of merging them.
- Reference PRs with full links — `[repo#NNN](url)` — never a bare `#NNN`.
  The family repositories share a number space; a bare number is ambiguous
  in replies, docs, and PR bodies.
- Reply to every unresolved PR comment.
  - Leave a reply on each review comment to indicate its status.
  - If fixed: comment "Fixed" or "Done" with a brief explanation.
  - If not an issue: comment explaining why (e.g., "Not applicable because...", "Already resolved...").
  - If uncertain: ask for clarification.
  - Check thread resolution status with GraphQL `isResolved` and address only
    unresolved comments.

## Settling Checks

Settle checks with `ghb pr verify`, in a background shell redirected per
`running-commands`. One command: it fails fast on a stale or unpushed
branch, waits out mergeability and every pending check, requires
`mergeStateStatus: CLEAN`, and prints one line.

Run it on the draft. Let ghb settle an empty check rollup; never declare
absence green by hand. Run it again after `gh pr ready`. That run settles
the full suite, which repositories gate behind ready and run without the
draft's Gradle cache.

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

3. **If working on an existing OPEN PR (including after `gh pr checkout <PR>`):**
   - Do NOT create a new branch
   - If the head branch matches `renovate/*`, run `gh pr merge --disable-auto <PR>` before making changes (idempotent)
   - Pull latest changes first
   - Commit changes to the current branch
   - Push to update the existing PR
   - Update PR description/title if needed using `gh pr edit`

4. **If on the default branch or no PR exists for current branch:**
   - Create a new feature branch (if not already on one)
   - Commit changes
   - Push with `-u origin <branch>` — both sync paths read
     `origin/<branch>`, which the first push creates
   - Sync immediately — `ghb pr sync`, or `references/manual-sync.md`
     without ghb — so the PR is born current
   - Create the new PR as a draft: `gh pr create --draft`

5. **Before finalizing:**
   - Review if documentation needs updates (README.md, AGENTS.md)
   - Remove completed plans from `docs/superpowers/plans/`.
   - Ensure PR description accurately reflects all changes including doc updates

6. **After pushing, before returning to the user:**
   - Settle the draft with `ghb pr verify`, review the diff (`git diff` or
     `gh pr diff`), mark ready with `gh pr ready`, then settle the full
     set — see `Draft, Ready, and Checks`. Do not run `gh pr ready` before
     the diff review.
   - If any check fails, diagnose and remediate the issue before returning
   - Do not consider the task complete while required checks are failing
   - Always notify the human with `[repo#NNN](url)`. A bare number forces a
     click to find the PR.
   - Stop there. Merging waits for the human's explicit confirmation.

### Draft, Ready, and Checks

Repositories that gate expensive suites behind "ready" run only the cheap
checks on a draft. The ready run uses a cold Gradle cache. The draft's warm
cache can hide bugs.

1. Settle the draft with `ghb pr verify`. See `Settling Checks`. Fix failures
   before review. Do not spend dedicated review time before the fast checks
   pass.
2. Review the diff with `git diff` or `gh pr diff` once the fast checks are
   green. Fix what you find on the same PR. Do not mark the PR ready before
   this review.
3. Mark the PR ready with `gh pr ready` only after the diff review.
4. Settle the full set with `ghb pr verify` again. Fix failures on the same
   PR: commit and push.
5. Notify the human with `[repo#NNN](url)`. Notify them even when checks are
   blocked or absent.

Fix failures at any step before moving on.

### Merging on the Human's Yes

On their yes, verify with `ghb pr verify`. Going raw, read
`mergeStateStatus` and `reviewDecision` — never `mergeable` alone. A
`BLOCKED` review or `CHANGES_REQUESTED` decision refuses the merge with
every check green. Do not arm auto-merge. Tell the human what holds the
merge and wait. Never use `--admin` unless the human asks.

**Never merge a pull request from a feature worktree.** Moving the session out
is a precondition of the merge, not cleanup after it. Do not merge from the
feature worktree to save a turn. `gh pr merge --disable-auto <PR>` is not a
merge. It only turns auto-merge off.

`gh` carries the PR title and body into the squash commit. Run `gh pr merge`
from the main worktree so `gh` removes the feature worktree and both branches.

If the session runs in the feature worktree, stop before the merge:

1. Record the path with `git rev-parse --show-toplevel`. Copy it into
   `<worktree-path>` below.
2. Call `session_move` by itself with the main worktree path. It lands at the
   next safe boundary.
3. End the turn. Merge in the next turn from the main worktree.

When the merge already ran from the feature worktree, `gh` skipped local
cleanup. Find `<worktree-path>` with `git worktree list`, then run:

```bash
git worktree remove <worktree-path>
git branch -D <branch>
git pull
```

After the session move, run the merge from the main worktree in the next
turn. `cd` is not a substitute for `session_move`: it lasts one command and
leaves the session in the feature worktree.

```bash
gh pr merge <PR> --squash --delete-branch
git pull
```

`gh` merges the head at merge time. A push after the yes needs a new yes.

### Self-Review Before Submitting

Before creating or updating a PR:

1. Run quality checks locally (tests, static analysis, formatting)
2. Apply `hemingway`'s rules to every piece of prose in the change
3. Review your own diff — would you approve this if someone else wrote it?
4. Check for obvious issues (debug prints, TODOs without tickets, unjustified suppressions)

**Fix issues yourself before requesting human review.**

## Troubleshooting

### Push rejected for workflow files

If a push is rejected with `refusing to allow ... without workflow scope`, your
base branch is usually behind `origin/HEAD` (a dependency bot updated a
workflow file on the remote), not an intentional workflow edit. See
`references/workflow-push-rejection.md` for the recovery steps.

### Squash Merge Strategy

This repository uses **squash merge** for PRs. This means:

- **Branch history doesn't matter** - All commits get squashed into one on merge
- **Merge is preferred over rebase** - When updating a branch with changes from develop, use `git merge origin/HEAD` instead of `git rebase`
- **Don't create new branches for updates** - If a PR needs changes, commit to the same branch and push
- **Don't worry about messy commits** - The squash merge cleans everything up

**When to update a branch:**

- If develop has moved forward and you need those changes: `git merge origin/HEAD`
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
body structure, and the grounded "why" (sourced from the sources listed
there — never fabricated). PR descriptions become
permanent commit history via squash merge.

### Creating a New PR

Always provide explicit title and body. Do NOT use `--fill` as it may use the branch name instead of a proper conventional commit message.

Pass the body with `--body-file -` and a quoted heredoc. Never embed newlines in a `--body "…"` argument: `\n` inside double quotes stays literal, and the garbage lands verbatim in the PR and the squash commit.

```bash
# Get the commit message for the title
TITLE=$(git log -1 --format="%s" HEAD)

# Create PR with proper title and body
gh pr create --draft --title "$TITLE" --body-file - <<'EOF'
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

Resolving a thread does not flip a `CHANGES_REQUESTED` review. The block
lifts only when the reviewer approves again or a user with write access
dismisses the review; until then the merge stays blocked.

**Note:** REST API doesn't expose resolved state - use GraphQL (`reviewThreads.isResolved`) or MCP tools to check unresolved comments.

## AI Attribution

Add an `Assisted-by` trailer to commit messages and PR descriptions. See
`references/commit-creator.md` for the format, placement, and rules.
