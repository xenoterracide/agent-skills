---
name: git-workflow
description: |
  Use when creating or updating pull requests, writing commit messages, or
  managing other git lifecycle tasks after session initialization.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Git Workflow

Cross-cutting guidance for git lifecycle tasks.

Load one of the focused git skills when the trigger applies:

- **`pull-request`** — Creating, updating, or submitting PRs; also whenever files
  are created, modified, or deleted.
- **`commit-message`** — Writing a commit message, PR title, or PR description.
- **`workflow-push-rejection`** — Recovering when a push is rejected for
  `workflow` scope (`.github/workflows`), usually caused by a stale base.

## Git Hooks

Hooks live in `.share/git/hooks`. `yarn contribute` sets `core.hooksPath` to
that directory automatically.

- **pre-commit**: Runs `lint-staged` to format and annotate licenses.
- **commit-msg**: Validates conventional commit messages against
  `git-conventional-commits.yaml`.
- **post-checkout / post-merge**: Syncs Node or Python dependencies when
  lockfiles changed.

All hooks exit early when the `CI` environment variable is set.
