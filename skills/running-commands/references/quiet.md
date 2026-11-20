<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Quiet Output

Tool output stays in the agent's context for the whole session. Every turn
re-sends it. One verbose command can cost more than the work around it.

## Redirect

Redirect long or repetitive output to a file. Read the tail, or grep it.
Tail the log when the command fails. Use `mktemp` for every file — fixed
names collide across sessions. Write to the harness's temp directory:
`/tmp/opencode` on OpenCode, `/tmp` elsewhere.

## Commit output

Commits print hook output only on failure:

```bash
log=$(mktemp /tmp/opencode/commit.XXXXXXXX 2>/dev/null || mktemp)
git commit -m "..." >"$log" 2>&1 ||
  { tail -40 "$log"; exit 1; }
git log --oneline -1
```

## Background waits

Watch and poll commands run as background shells; the completion
notification is the wake-up. Redirect to a file and tail inside the call, so
the notification carries only the tail:

```bash
log=$(mktemp /tmp/opencode/checks.XXXXXXXX 2>/dev/null || mktemp)
slow-watch-command >"$log" 2>&1; ec=$?
tail -15 "$log"; exit $ec
```

### CI waits

`ghb pr verify` prints one line: pass, a failure, or pending. Run
`ghb pr verify` directly. Do not redirect its output. The redirect pattern
above is for noisy commands.

Use a background shell when the poll can run longer than the foreground
timeout. The completion notification carries the line. No file needed.

## Quiet flags

Prefer a tool's quiet knob where it keeps error output:

| Tool      | Quiet knob                                    |
| --------- | --------------------------------------------- |
| git       | `--quiet`, `status --porcelain`, `NO_COLOR=1` |
| pnpm      | `--reporter=silent`                           |
| npm, yarn | `--silent`                                    |
| uv        | `--quiet`                                     |
| Maven     | `-B -q --no-transfer-progress`                |
| Gradle    | `-q --console=plain`                          |
| gh        | none — redirect long output                   |
| ghb       | none — already one line                       |

Never use a flag that hides warnings or failures. eslint's `--quiet` means
"errors only."
