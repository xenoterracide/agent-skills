---
name: git-workflow
description: |
  Use when creating or updating pull requests, writing commit messages, or
  managing other git lifecycle tasks after session initialization.
has-sub-skill: true
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Git Workflow

## Sub-skills

- **`git-workflow.pull-request`** — Use whenever files are created, modified,
  or deleted; handles committing, pushing, and PR lifecycle.
- **`git-workflow.commit-message`** — Use when writing a commit message, PR
  title, or PR description.
- **`git-workflow.workflow-push-rejection`** — Use when a push is rejected for
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
