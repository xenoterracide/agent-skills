---
name: git-workflow
description: |
  Use when creating, opening, updating, or submitting a pull request; when
  asked to merge one — agents verify the PR and wait for fresh, explicit human
  confirmation before merging; when files are created, modified, or deleted;
  when addressing PR review comments or feedback; when writing a commit
  message, PR title, or PR description; and when a git push is rejected citing
  `.github/workflows` or a missing `workflow` token scope. Read the matching
  file in `references/` for the detailed procedure before doing the work.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Git Workflow

Routes to the detailed procedures for the pull-request, commit, and push
lifecycle. This skill applies whenever files are created, modified, or deleted.

Read the reference that matches the task before starting:

| Task                                                     | Read                                    |
| -------------------------------------------------------- | --------------------------------------- |
| Create, open, update, or review a PR; files changed      | `references/pull-request.md`            |
| Write a commit message, PR title, or PR description      | `references/commit-creator.md`          |
| Push rejected for `workflow` scope (`.github/workflows`) | `references/workflow-push-rejection.md` |

## Required Companion Skills

Load `hemingway` when writing or editing prose in these references.

## Shared rules

These apply to every git workflow activity in this repository:

- **Merge only on explicit confirmation.** Never merge on your own
  initiative. An instruction given before the human read the PR is not
  confirmation. Before merging, show the PR — URL, head SHA, and green
  required checks — and ask the human to confirm. Only then run
  `gh pr merge`.
- **Never force push.** `--force` and `--force-with-lease` are blocked by
  repository rules and are unnecessary with squash merge. If a push is
  rejected, create a new commit instead.
- **Squash merge.** This repository squash-merges PRs, so branch history is
  cleaned on merge. Prefer `git merge origin/develop` over `git rebase` when
  syncing, and commit to the same branch for updates rather than creating new
  branches.
- **Verify checks before returning.** Always confirm required GitHub checks
  pass (`gh pr checks --watch --required` or an MCP equivalent) before ending
  the task, and print the PR URL.
