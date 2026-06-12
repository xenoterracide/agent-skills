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

**REQUIRED SUB-SKILL:** Use `superpowers:writing-skills` when the guidance
would be better expressed as a reusable skill.

## When to Create or Update

- A project has conventions agents must follow on every session
- Directory-specific rules differ from parent directories
- You modify files, styles, structures, workflows, or configurations that
  `AGENTS.md` describes

## What Belongs in AGENTS.md

- Stable, project-wide conventions with low churn
- Build, test, lint, and formatting commands
- License and copyright requirements
- Skill routing guidance for the repository
- References to source-of-truth files (not copies of their contents)

## Reference Source-of-Truth Files

Do not duplicate information that is already maintained in another file.
Instead, point agents to the canonical source:

- Tool versions → `.tool-versions`, `package.json` engines, `pyproject.toml`
- Dependencies → `package.json`, `build.gradle.kts`, `uv.lock`
- Scripts → `package.json` scripts, `Makefile`, `Taskfile.yml`
- CI configuration → `.github/workflows/*.yml`

This prevents `AGENTS.md` from drifting out of sync with the project.

## Prefer Tool Retrieval Over Documentation

Do not write instructions that duplicate information an agent can retrieve at
runtime with local tools. Point agents to the tool or command instead:

- Installed packages or dependency versions → `package.json`, `yarn list`, or
  `uv pip list`
- Available scripts → `package.json`, `yarn run`, or `--help`
- File contents or structure → `ls`, `find`, `fd`, or `rg`
- Git state → `git status`, `git log`, `gh pr view`
- Environment details → `env`, `asdf current`, `.tool-versions`

If a value can change between sessions, prefer live retrieval over hard-coding
it in `AGENTS.md`.

## What Does NOT Belong in AGENTS.md

Avoid high-churn and rarely-needed content:

- Specific bug workarounds
- Temporary migration steps
- Per-feature or per-ticket instructions
- Detailed API or library documentation
- Instructions for tasks that will rarely be needed; tell agents about
  one-off or infrequent work in the moment instead

For reusable techniques, write a skill instead. For temporary or personal
project guidance, use agent-specific files such as `CLAUDE.md` or `GEMINI.md`.

## CONTRIBUTING.md for Human Contributors

`AGENTS.md` is for agent instructions, not human contributors. Put
human-oriented contribution guidance in `CONTRIBUTING.md` instead:

- How to set up a development environment
- How to run tests and linting
- How to submit issues and pull requests
- Coding standards for human reviewers
- Community guidelines

Always load `CONTRIBUTING.md` when it exists and reference it from `README.md`.
Update `CONTRIBUTING.md` when you change workflows that affect human
contributors.

## Format

- Keep it concise; agents load this on every session
- Use clear headings and scannable lists
- Include SPDX copyright and license identifiers
- Place the file at the root or directory level it governs

## Token Efficiency

`AGENTS.md` consumes context on every session, so brevity matters. Treat it like
a frequently-loaded skill:

- Keep the file short; move detailed reference material into skills or separate
  documents
- Cross-reference skills instead of duplicating their guidance
- Prefer bullets and tables over long paragraphs
- Avoid copy-pasting command help or API docs; point to `--help` or external
  references instead

If a convention is reusable across projects, write a skill instead of expanding
`AGENTS.md`.

## Maintenance Rule

If you modify anything `AGENTS.md` describes, update `AGENTS.md` in the same
change. Do not let agent instructions drift out of sync with the project.
