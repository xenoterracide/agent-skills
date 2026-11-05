---
name: code-review
description: |
  Use when reviewing completed work, a change, or a pull request — dispatched
  as a reviewer subagent or asked directly — before writing the review.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Code Review

Review completed work and report findings with evidence. Never spawn
sub-reviewers; the review seat is this skill, not another reviewer.

## Required Companion Skills

Load these skills whenever this skill applies:

- **`hemingway`** — before writing the report. A prescribed format is
  structure; hemingway governs the prose inside it.

## Route the Diff First

Before reviewing, map the diff's domains to the skill catalog and load every
match: `testing`, `docs-creator`, `version-managers`, `java-creator`,
`gradle-creator`, `shell-script-creator`. A review that skips this
judges without the standards it is judging against.

## Dispatched With a Prescribed Prompt

Follow the prompt. It owns the method and the output format.

## Direct Request

No prompt prescribes the method, so this skill does:

1. Read the binding spec or plan before the diff.
2. Review the full commit range, not just the head commit.
3. Verify read-only: run tests in a temp worktree, check CI evidence. Never
   trust a claim you did not see pass.
4. Calibrate severity: Critical, Important, Minor. Not everything is
   Critical.
5. Every finding cites file:line, what is wrong, and why it matters.
6. List declined-to-judge items, one line each, with the reason.
7. End with a clear verdict: ready to merge, yes, no, or with fixes.
