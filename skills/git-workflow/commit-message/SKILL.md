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

- Output plain text only — no Markdown headings (`##`), bold, or fenced code
  blocks. The body is reused verbatim as the squash-merge commit message.
- First line MUST be a valid Conventional Commit subject.
- First line: aim for ≤ 50 characters, hard limit ≤ 72.
- Use a specific scope when possible.
- Use directional verbs that reflect what happened in the diff (e.g. add, remove,
  update, refactor, fix) rather than neutral nouns.
- Body (MANDATORY): explain WHAT changed with bullets, and add WHY when the
  motivation is not obvious from the diff (see "Grounding the Why").
  - Use bullet points explaining the main changes
  - Each bullet must describe one complete logical change
  - Do not split a single idea across multiple bullets
  - Wrap lines to <= 75 chars

## Grounding the Why

The "why" captures motivation the diff cannot show. It is valuable, but it MUST
come from a real source — never invented to fill the field. Take it, in order
of preference, from:

1. The issue or ticket the change closes — link it (`Closes #123`) and let it
   carry the rationale instead of restating a guess.
2. The reason the user gave in the request or conversation.
3. The review comment, bug report, or failing test that triggered the change.

If none of these gives you the motivation, do not guess: ask the user for one
line, or omit the why and state only the what. A fabricated rationale in
permanent history is worse than no rationale.

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
