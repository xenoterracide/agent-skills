---
name: refine
description: |
  Use when the user names the refine phase or asks to refine a Jira issue.
  Use when refinement questions follow a tracker move.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Refine

Read `.config/agent/project.yaml` before tracker work. When it is missing,
stop and name the path. Use `jira-workflow` for issue reads, moves, and
comments.

This skill owns the `refine phase` and the `tracker.statuses.refining` role.

## Required Companion Skills

- **`jira-workflow`** — issue reads, moves, and comments
- **`hemingway`** — refinement questions are prose

## Procedure

1. Read `.config/agent/project.yaml`. Read the named issue. Stop and name the
   current status when the issue is not in `tracker.statuses.captured`.
2. Move the issue to `tracker.statuses.refining` before questions. Use the
   `jira-workflow` move rule. Do not cache the status.
3. Ask refinement questions until all outstanding questions are answered. Put
   the agreed spec in the issue description. Do not add a breakdown while the
   issue is in `tracker.statuses.refining`.
4. When all outstanding questions have been answered, ask whether to move the
   issue to `tracker.statuses.ready`. Move through `jira-workflow` only on yes.
   On no, leave the issue in `tracker.statuses.refining` and stop. The caller
   may resume later. Do not infer the next phase.

## Non-goals

- No new status or transition.
- No breakdown in `tracker.statuses.refining`.
- No Jira field, tool, or transition rules copied from `jira-workflow`.
