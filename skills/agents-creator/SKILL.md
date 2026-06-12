---
name: agents-creator
description: |
  Use when creating, updating, or reviewing `AGENTS.md` files that provide
  project-level guidance to AI coding agents. Use when deciding whether
  guidance belongs in `AGENTS.md`, a reusable skill, or another document.
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

## Format

- Keep it concise; agents load this on every session
- Use clear headings and scannable lists
- Include SPDX copyright and license identifiers
- Place the file at the root or directory level it governs

## Maintenance Rule

If you modify anything `AGENTS.md` describes, update `AGENTS.md` in the same
change. Do not let agent instructions drift out of sync with the project.
