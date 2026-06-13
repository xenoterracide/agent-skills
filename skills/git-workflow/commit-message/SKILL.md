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

Add an Assisted-by trailer at the end of the commit message body (after the
description, before any footer markers like `BREAKING CHANGE:`):

```
Assisted-by: <AI_NAME>:<MODEL_VERSION> [TOOL1] [TOOL2]
```

This follows the Linux kernel convention for AI attribution. `MODEL_VERSION`
is the specific model or agent version used. Optional `[TOOL1] [TOOL2]` list
specialized analysis tools (e.g., `coccinelle`, `sparse`). Do not list basic
tools like `git`, `gcc`, or editors.

Examples:

```
Assisted-by: Kimi:kimi-code-cli
Assisted-by: Claude:claude-3-opus coccinelle sparse
```

**Do not add `Signed-off-by` trailers.** Only humans can certify the Developer
Certificate of Origin.

---

SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
