---
name: verification-before-completion
description: |
  Use when about to claim work is complete, fixed, or passing, before
  committing or creating PRs. Requires running verification commands,
  reviewing the diff, and dispatching a code reviewer subagent.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Verification Before Completion

Claiming work is complete without verification and review is dishonesty, not
efficiency.

**Core principle:** Evidence before claims, always.

## The Gate Function

BEFORE claiming any status or expressing satisfaction:

1. **IDENTIFY:** What command proves this claim?
2. **RUN:** Execute the FULL command (fresh, complete).
3. **READ:** Full output, check exit code, count failures.
4. **REVIEW:** Inspect the diff for obvious issues such as duplicate license
   headers, stale comments, formatting problems, or unrelated changes.
5. **REQUEST REVIEW:** Invoke `requesting-code-review` and dispatch a reviewer
   subagent. Fix Critical issues immediately and Important issues before
   claiming completion.
6. **VERIFY:** Does the output and review feedback confirm the claim?
   - If NO: State actual status with evidence.
   - If YES: State claim WITH evidence.
7. **ONLY THEN:** Make the claim.

Skip any step = lying, not verifying.

## Common Failures

| Claim                   | Requires                        | Not Sufficient                 |
| ----------------------- | ------------------------------- | ------------------------------ |
| Tests pass              | Test command output: 0 failures | Previous run, "should pass"    |
| Linter clean            | Linter output: 0 errors         | Partial check, extrapolation   |
| Build succeeds          | Build command: exit 0           | Linter passing, logs look good |
| Bug fixed               | Test original symptom: passes   | Code changed, assumed fixed    |
| License headers correct | `reuse lint` passes             | Headers look right             |

## Red Flags - STOP

- Using "should", "probably", "seems to".
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!").
- About to commit/push/PR without verification or review.
- Trusting agent success reports without inspecting the diff.
- Relying on partial verification.

## The Bottom Line

No shortcuts for verification or review. Run the command, read the output,
review the diff, dispatch a reviewer, THEN claim the result.

This is non-negotiable.
