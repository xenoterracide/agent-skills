---
name: using-xenoterracide-agent-skills
description: |
  Use at the start of any session with the xenoterracide-agent-skills plugin,
  and whenever unsure which skill to use. Covers how to find and invoke the
  plugin's skills, plus the startup checks — repository and PR state,
  `README.md`/`AGENTS.md`, current branch — to run before any other action.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Using Xenoterracide's Agent Skills

## Using the skills

- Each skill's `description` is the authoritative trigger. Invoke the skill
  whose description matches the task — process skills before implementation
  skills.
- Skills reference the Superpowers plugin's process-discipline skills (for
  example `verification-before-completion` and `requesting-code-review`);
  install Superpowers alongside this plugin for those to resolve.
- User instructions always take precedence over skill guidance.

## Merging

Never merge the PR on your own initiative, in any repository. Show the PR
URL, head SHA, and green checks, and wait for the human's explicit yes. An
instruction from before the human read the PR is not confirmation. Syncing a
topic branch with its base is safe routine sync. The `git-workflow` skill
carries the full rule.

## Plans and Execution

Do not ask your partner to approve a plan or choose an execution method.
State the plan, pick the method, proceed. Pick `native` for small plans
whose tasks share no interfaces; pick `subagent-driven` when tasks are many
or share interfaces. Say the pick and why in one line. Merges, pushes to
shared branches, publishes, and destructive or security-sensitive actions
still stop and ask.

Commit each completed step and push it. Open the pull request as a draft
once the first step is pushed. Do not ask. Watch the draft checks. When they
pass, mark the PR ready with `gh pr ready`, then watch the checks that ready
releases. Report the URL, head SHA, and green checks when those pass. The
merge still waits for the human's yes.

## Writing Style

Invoke `hemingway` now. Read the prose facet before the first prose you
write in a session — chat replies included. Read the code facet before
writing or naming code. Every message you send your partner, and every file
you write, follows it. Short. Concrete. No filler.

## Quiet command output

Keep command output small. These flags keep failures visible and cut the
rest. The `output-hygiene` skill carries the redirect patterns.

- git: add `--quiet` to `fetch`, `pull`, `push`, `commit`, `merge`; use
  `status --porcelain`; set `NO_COLOR=1` for captured output
- pnpm: `--reporter=silent` (npm and yarn: `--silent`)
- uv: `--quiet`
- Maven: `-B -q --no-transfer-progress`
- Gradle: `-q` and `--console=plain`
- gh: no quiet mode — redirect per `output-hygiene`

## Read Project Documentation First

Before any investigation or code changes, read the project's canonical
documentation:

- **`README.md`** — always read this first for install, update, usage, and
  contribution instructions
- **`AGENTS.md`** — read any `AGENTS.md` files that apply to the directories you
  will work in; deeper files take precedence over parent ones

## Startup Checks

Run these before any other action. Stale branch state wastes work on
merged PRs and outdated code.

**Preferred: MCP tools** — `list_pull_requests` or `pull_request_read` give
PR state as structured data, no shell parsing.

**Alternative: git and gh:**

```bash
git fetch --all --prune
git status
gh pr view --json number,url,headRefName,state,baseRefName
```

Then act on the PR state:

- **No PR** — switch to the default branch and pull:
  `git checkout "$(git rev-parse --abbrev-ref origin/HEAD)"` then `git pull`
- **PR OPEN** — pull the base branch into the current branch and continue
  work on it
- **PR CLOSED or MERGED** — the branch is stale. Switch to the default
  branch, pull, delete the stale branch, create a fresh one.

## Before Claiming Completion

Before claiming any task is complete, fixed, passing, ready, or working, invoke
`completion-checklist` and follow its gate function. This applies to every task
in every repository, regardless of size or whether it will be committed or
PR'd. There are no exceptions.

## Do Not Assume Synchronized State

Local state may be stale, and other sessions may share the checkout — the
operator merges PRs, switches branches, and edits files outside any one
session. Verify branch, PR, and file state before acting on it.

## GitHub Workflow Scope

An agent token usually lacks the `workflow` scope and cannot push changes
under `.github/workflows/`. A push rejected for workflow scope is usually a
stale base, not an intentional edit — see the `git-workflow` skill
(`references/workflow-push-rejection.md`). Mark genuine workflow-file edits
as human-required tasks.
