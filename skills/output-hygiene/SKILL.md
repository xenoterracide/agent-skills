---
name: output-hygiene
description: |
  Use when a command's output will be long or repetitive: build and test
  logs, watch or poll loops, git commits through hooks, CI status checks.
  Redirects the output to files so only the tail enters the agent's
  context.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Output Hygiene

Tool output stays in the agent's context for the whole session. Every turn
re-sends it. One verbose command can cost more than the work around it.

## Rules

1. Redirect long or repetitive output to a file. Read the tail, or grep it.
2. Commits print hook output only on failure:

   ```bash
   log=$(mktemp /tmp/opencode/commit.XXXXXXXX 2>/dev/null || mktemp)
   git commit -m "..." >"$log" 2>&1 ||
     { tail -40 "$log"; exit 1; }
   git log --oneline -1
   ```

3. Watch and poll commands run as background shells; the completion
   notification is the wake-up. Redirect to a file and tail inside the
   call, so the notification carries only the tail:

   ```bash
   log=$(mktemp /tmp/opencode/checks.XXXXXXXX 2>/dev/null || mktemp)
   slow-watch-command >"$log" 2>&1; ec=$?
   tail -15 "$log"; exit $ec
   ```

   For `gh pr checks`, skip `--watch` and its table. Run this skill's
   `scripts/gh-pr-wait.sh` (relative to its base directory) in a
   background shell instead — one line of output, fail-fast, bounded at
   10 minutes:

   ```bash
   "<base directory>/scripts/gh-pr-wait.sh" --required
   ```

4. Use `mktemp` for every file. Fixed names collide across sessions.
   Write to the harness's temp directory — `/tmp/opencode` on OpenCode,
   `/tmp` elsewhere.
5. Prefer a tool's quiet knob where it keeps error output — `--quiet`,
   `--silent`, `--log-level silent`, `--console plain`. Strip color from
   captured output with `NO_COLOR=1`. Never use a flag that hides warnings
   or failures. eslint's `--quiet` means "errors only."
