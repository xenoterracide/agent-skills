---
name: git-workflow
description: |
  Use when creating or updating pull requests, writing commit messages, or
  managing other git lifecycle tasks after session initialization.
has-sub-skill: true
license: CC-BY-NC-SA-4.0
metadata:
  author: Caleb Cushing <caleb.cushing@gmail.com>
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Git Workflow

## Sub-skills

- **`pull-request`** — Use whenever files are created, modified, or deleted;
  handles committing, pushing, and PR lifecycle.
- **`commit-message`** — Use when writing a commit message, PR title, or PR
  description.

## Git Hooks

Hooks live in `.share/git/hooks` and are configured via
`git config core.hooksPath .share/git/hooks` (run automatically by
`yarn contribute`):

- **pre-commit**: Runs `lint-staged` to format and annotate licenses.
- **commit-msg**: Validates conventional commit messages against
  `git-conventional-commits.yaml`.
- **post-checkout / post-merge**: Syncs Node or Python dependencies when
  lockfiles changed.

All hooks exit early when the `CI` environment variable is set.
