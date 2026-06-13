---
name: agents-creator
description: |
  Use when initializing, creating, updating, reviewing, or generating
  `AGENTS.md` files that provide project-level guidance to AI coding agents.
  Use when analyzing a codebase to decide whether guidance belongs in
  `AGENTS.md`, a reusable skill, or another document.
license: CC-BY-NC-SA-4.0
metadata:
  author: Caleb Cushing <caleb.cushing@gmail.com>
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Agents Creator

Guidance for creating and maintaining `AGENTS.md` files.

## Overview

`AGENTS.md` provides project-level instructions to AI coding agents. It governs
the directory it lives in and all subdirectories. Deeper `AGENTS.md` files take
precedence over parent ones, and user instructions always take highest
precedence.

**REQUIRED SUB-SKILL:** Use `writing-skills` when the guidance would be better
expressed as a reusable skill. This skill is provided by the Superpowers plugin;
install it alongside this plugin for the referenced workflow to be available.

## When to Create or Update

- Conventions agents must follow on every session
- Directory-specific rules differ from parent directories
- You modify files, styles, structures, workflows, or configs `AGENTS.md`
  describes

## What Belongs in AGENTS.md

- Stable, low-churn conventions
- Build, test, lint, and formatting commands
- License and copyright requirements
- Skill routing guidance
- References to source-of-truth files and retrievable state

## What Does NOT Belong in AGENTS.md

Avoid duplicating or high-churn content:

- Bug workarounds, migration steps, or per-ticket instructions
- Detailed API or library documentation
- Rarely-needed tasks; tell agents in the moment instead
- Human contributor guidance → `CONTRIBUTING.md`
- Values retrievable with local tools → point to the tool or file

For reusable techniques, write a skill. For temporary guidance, use
`CLAUDE.md` or `GEMINI.md`.

## Reference, Do Not Duplicate

Point agents to the canonical source rather than copying it:

- Tool versions → `.tool-versions`, `package.json`
- Dependencies → `package.json`, `build.gradle.kts`, `uv.lock`
- Scripts → `package.json`, `Makefile`, `--help`
- Git state → `git status`, `git log`, `gh pr view`
- Environment → `env`, `asdf current`
- Plugin manifest → `.kimi-plugin/plugin.json`

If a value can change between sessions, prefer live retrieval.

## CONTRIBUTING.md for Human Contributors

Put human-oriented contribution guidance in `CONTRIBUTING.md`. Load it when it
exists and reference it from `README.md`.

## Template

```markdown
<!--
SPDX-FileCopyrightText: Copyright © 2026 Author Name
SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Project Name

One-line description.

## Build and Test

- Run tests: `<test-command>`
- Run lint: `<lint-command>`

## Source of Truth

- Tool versions → `<version-file>`
- Scripts → `<script-source>`

## Maintenance

Update this file when you change workflows it describes.
```

## Format

- Keep it concise; agents load this on every session
- Use clear headings and scannable lists
- Include SPDX copyright and license identifiers
- Place the file at the root or directory level it governs

## Token Efficiency

`AGENTS.md` consumes context on every session:

- Move detailed reference to skills or separate docs
- Cross-reference skills instead of duplicating guidance
- Prefer bullets and tables over paragraphs
- Point to `--help` or external references instead of copying them

## Maintenance Rule

If you modify anything `AGENTS.md` describes, update `AGENTS.md` in the same
change.
