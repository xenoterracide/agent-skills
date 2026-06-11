---
name: commit-message
description: |
  Use when writing a commit message, PR title, or PR description.
license: CC-BY-NC-SA-4.0
metadata:
  author: Caleb Cushing <caleb.cushing@gmail.com>
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Commit Message

## Instructions

- Use for PR's or commit message's
- this is a git conventional commit format
  - review `git-conventional-commits.yaml` values in `convention.commitTypes` for `<type>`'s available
- the git subject line becomes the PR title
- You MUST follow the exact template

## Rules

- Output plain text only. No markdown fences.
- First line MUST be a valid Conventional Commit subject.
- First line: aim for ≤ 50 characters, hard limit ≤ 72.
- Use a specific scope when possible.
- Body (MANDATORY - must explain WHAT):
  - Use bullet points explaining the main changes
  - Each bullet must describe one complete logical change
  - Do not split a single idea across multiple bullets
  - Wrap lines to <= 75 chars

## Template

<type>(<scope>): <summary>

<body>

## AI Attribution

Add a Co-authored-by trailer at the end of the commit message body (after the description, before any footer markers like `BREAKING CHANGE:`):

```
Co-authored-by: <AI_NAME> <AI_NOREPLY_EMAIL>
```

Use your AI identity:

| AI Name | `AI_NAME`        | `AI_NOREPLY_EMAIL`           |
| ------- | ---------------- | ---------------------------- |
| Kimi    | `Kimi`           | `kimi@moonshot.localhost`    |
| Copilot | `GitHub Copilot` | `copilot@github.localhost`   |
| Claude  | `Claude`         | `claude@anthropic.localhost` |

---

SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
