---
name: completion-checklist
description: |
  Use when finishing any task, wrapping up work, reporting results, giving a
  status update, or about to claim a task, implementation, fix, or test result
  is complete, done, fixed, passing, ready, or working. Invoke before saying
  "done", "complete", "fixed", "passing", "ready", "works", or reporting that
  something is finished.
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

1. **Identify** the command or status that proves the claim.
2. **Fetch** the evidence. Invoke `running-commands`, then capture hook exit
   codes, `ghb pr verify` output, or the output from the agent's own targeted
   run. Never fetch a fresh full re-run.
3. **Read** the evidence, check exit codes, count failures.
4. **Review** the diff for duplicate license headers, stale comments,
   formatting problems, unrelated changes, or obvious bugs.
5. **Request review** — invoke `requesting-code-review` and dispatch a reviewer
   subagent. Fix Critical issues immediately. Fix Important issues before
   claiming completion.
6. **Verify** the evidence and review feedback confirm the claim.
7. **Only then** make the claim — with evidence.

Skip any step = lying, not verifying.

## Done is a pipeline

Done is not a moment. It is a pipeline:

plan work complete → draft checks through `ghb pr verify` → review the diff →
PR marked ready with `gh pr ready` → full checks through `ghb pr verify` →
notify with `[repo#NNN](url)` on every outcome.

Mid-task status reports cite the latest fetched status. The done claim requires
the ready-gated checks green.

## Evidence, not re-runs

`verification-before-completion` demands fresh full runs of linters, builds,
and tests before every claim. That demand does not apply here. This checklist
fetches evidence — hook exit codes, CI status, and targeted runs — and does not
re-run what hooks or CI already own.

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

| Claim                   | Requires                                             | Not sufficient              |
| ----------------------- | ---------------------------------------------------- | --------------------------- |
| Tests pass              | Touched-suite output or CI green                     | Previous run, "should pass" |
| Linter clean            | Pre-push exit or CI                                  | Partial check               |
| License headers correct | Pre-commit exit (annotate) or CI                     | Looks right                 |
| Bug fixed               | Original symptom passes (agent's own run, unchanged) | Code changed                |

This is non-negotiable.
