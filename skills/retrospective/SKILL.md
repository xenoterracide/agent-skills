---
name: retrospective
description: |
  Use when the user names the retrospective phase for a Jira issue. Use when
  a done ticket needs a session review before the next phase.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Retrospective

Read `.config/agent/project.yaml` before tracker work. When it is missing,
stop and name the path. Use `jira-workflow` for issue reads.

This skill owns the `retrospective phase` and the `tracker.statuses.done` role.

## Required Companion Skills

- **`completion-retrospective`** — session review and tracker work
- **`jira-workflow`** — issue reads
- **`hemingway`** — report prose

## Preconditions

1. Read `.config/agent/project.yaml`. Read the named issue. Confirm its status
   matches `tracker.statuses.done`. Stop when it does not.
2. Confirm merged code and green checks. Stop when either is missing.
3. Do not change the issue status. The issue is already done.

## Procedure

1. Call `completion-retrospective` directly. Pass the completed ticket.
2. Report its created keys, observations, and findings summary.
3. Do not call a router. Do not infer the next phase. The caller names it.

## Non-goals

- No new status or transition.
- No status change during the retrospective.
- No Jira field, tool, or transition rules copied from `jira-workflow`.
