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

3. Watch and poll commands run to completion redirected, then tail:

   ```bash
   log=$(mktemp /tmp/opencode/checks.XXXXXXXX 2>/dev/null || mktemp)
   gh pr checks --watch --required >"$log" 2>&1
   ec=$?
   tail -15 "$log"
   exit $ec
   ```

4. Write to the harness's temp directory — `/tmp/opencode` on OpenCode,
   `/tmp` elsewhere — one unique file per run. Fixed names collide across
   concurrent sessions; `mktemp` never does.
5. Redirect, never silence. Quiet flags and hidden output lose the failure
   that explains the exit code.
