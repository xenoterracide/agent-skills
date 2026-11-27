<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Refine Move Gate Design

## Intent

Refine should move a ticket only after every outstanding question is answered.
The user, not the skill, decides whether to make that move.

## Approaches

- Automatic move when questions run out. Rejected: the user wants a question.
- Gate after every answer. Rejected: noisy and not at the end.
- Single gate at the end. Chosen: one question after clarification finishes.

## Design

1. Step 3 asks clarification questions until none remain.
2. Step 4 asks whether to move the issue to `tracker.statuses.ready`.
3. On yes, move through `jira-workflow`. On no, leave the issue in
   `tracker.statuses.refining` and stop. The caller may resume later.
4. Static tests pin the gate strings. The single eval drops "No follow-up
   questions" and asserts the move question.

## Constraints

- Name the role, not the literal status.
- No new config key, status, or transition.
- No phase inference. The caller names the next phase.

## Non-goals

- No repeated gate after a decline.
- No breakdown in `tracker.statuses.refining`.
- No copied Jira field, tool, or transition rules.
