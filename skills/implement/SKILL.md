---
name: implement
description: |
  Use when the user names the implement phase or asks to implement a Jira
  issue. Use when work starts from a ready breakdown.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Implement

Read `.config/agent/project.yaml` before tracker work. When it is missing,
stop and name the path. Use `jira-workflow` for issue reads, moves, and
comments.

This skill owns the `implement phase` and the `tracker.statuses.building` role.

## Required Companion Skills

- **`jira-workflow`** — issue reads, moves, and comments
- **`hemingway`** — issue comments are prose

## Procedure

1. Read `.config/agent/project.yaml`. Read the named issue. Read its child
   work items. Require at least one child in `tracker.statuses.ready`.
2. When no breakdown exists, stop and name the missing breakdown. Do not move
   the issue.
3. Start the first work item. Move the issue to
   `tracker.statuses.building` when that item starts. Use the `jira-workflow`
   move rule.
4. Work the breakdown. Use `jira-workflow` for tracker operations. Do not
   infer the next phase. The caller names it.

## Non-goals

- No new status or transition.
- No work without a ready breakdown.
- No Jira field, tool, or transition rules copied from `jira-workflow`.
