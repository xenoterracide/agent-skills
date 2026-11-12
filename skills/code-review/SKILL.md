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
- **`github`** — before posting the review to a pull request. It owns the
  review API mechanics.

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

## Post the Review to the PR

Applies to both paths. A dispatch prompt that forbids external writes wins.

When the change under review is a pull request, post the review before
replying. A branch diff with no PR stays in chat.

- One review holds every anchored finding. Never one comment per finding.
- Lead each comment with its severity. Say what is wrong and why it matters.
  Chat does not repeat it.
- Event: `REQUEST_CHANGES` for any Critical or Important finding. `COMMENT`
  otherwise. Never `APPROVE`.
- Findings that cannot anchor go in the review body under `Not on the diff`:
  unchanged code, a deleted line, a missing file. Cite `file:line` there; the
  anchor is gone.
- A re-review after a push is a fresh review. Skip a finding already posted
  at the same path and line.
- Reply with the verdict, the severity counts, and the review URL.
