---
name: completion-checklist
description: |
  Use when about to claim any task, implementation, fix, or test result is
  complete, done, fixed, passing, ready, or working. Invoke before saying
  "done", "complete", "fixed", "passing", "ready", or "works".
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Completion Checklist

**Invoke this skill BEFORE every completion claim.** No exceptions. Not for
small changes. Not for "obvious" fixes. Not when the task is already verified.
Not when tired. Not when the user asked for a quick report.

Claiming work is complete without verification and review is dishonesty, not
efficiency.

## The Gate

Before saying "done", "complete", "fixed", "passing", "ready", or "works":

1. **Identify** the command that proves the claim.
2. **Run** that command fresh, completely.
3. **Read** the output, check exit codes, count failures.
4. **Review** the diff for duplicate license headers, stale comments,
   formatting problems, unrelated changes, or obvious bugs.
5. **Request review** — invoke `requesting-code-review` and dispatch a reviewer
   subagent. Fix Critical issues immediately. Fix Important issues before
   claiming completion.
6. **Verify** the output and review feedback confirm the claim.
7. **Only then** make the claim — with evidence.

Skip any step = lying, not verifying.

## Red Flags — STOP

- "Should work now"
- "Looks correct"
- "I'm confident"
- "Just this once"
- "It's a small change"
- "It's already verified"
- "The user just wants a quick report"
- About to say "done" without running verification
- About to say "done" without reviewing the diff
- About to say "done" without requesting review

## Rationalizations That Fail

| Excuse                              | Reality                                    |
| ----------------------------------- | ------------------------------------------ |
| "It's already verified"             | Verification without review is incomplete. |
| "It's a simple change"              | Simple changes ship obvious bugs.          |
| "The user asked for a quick report" | Accuracy matters more than speed.          |
| "I ran it earlier"                  | Earlier runs don't prove current state.    |
| "No code changed"                   | Metadata, docs, and configs break too.     |

## Common Failures

| Claim                   | Requires                     | Not sufficient              |
| ----------------------- | ---------------------------- | --------------------------- |
| Tests pass              | Test output shows 0 failures | Previous run, "should pass" |
| Linter clean            | Linter output shows 0 errors | Partial check               |
| Bug fixed               | Original symptom passes      | Code changed                |
| License headers correct | `reuse lint` passes          | Looks right                 |

This is non-negotiable.
