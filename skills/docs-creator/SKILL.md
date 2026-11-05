---
name: docs-creator
description: |
  Use when creating, updating, or reviewing repository documentation — a
  `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, or any Markdown in a skill,
  including its `SKILL.md` and `references/`. Use when deciding whether content
  belongs in `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, or a skill. Use when
  adding skills, fixing frontmatter, or improving skill trigger wording and
  discoverability. Read the matching file in `references/` for the authoring
  guidance.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Docs Creator

Routes to authoring guidance for the project's documentation and skill files.

Read the reference that matches the file being written or revised:

| Writing or revising         | Read                                 |
| --------------------------- | ------------------------------------ |
| `README.md`                 | `references/readme-creator.md`       |
| `AGENTS.md`                 | `references/agents-creator.md`       |
| `CONTRIBUTING.md`           | `references/contributing-creator.md` |
| A reusable skill `SKILL.md` | `references/skill-creator.md`        |
| Reviewing a skill           | `references/skill-reviewer.md`       |

`references/contributing-examples.md` holds tool-specific command examples for
the `CONTRIBUTING.md` guidance. `references/skill-reviewer-template.md` holds
the reviewer subagent prompt used by `skill-reviewer.md`.

## Required Companion Skills

Every piece of prose this skill writes or revises must pass `hemingway`'s
rules. Apply them on each change. Do not submit prose that skipped the
pass.

## Shared rules

- Keep each document focused: agent guidance lives in `AGENTS.md`, human
  contributor guidance in `CONTRIBUTING.md`, and user-facing install/usage in
  `README.md`.
- Update the affected document(s) in the same change as the thing they describe.
- Put stable, low-churn content in the document; reference source-of-truth
  files and tools rather than duplicating retrievable state.
