---
name: running-commands
description: |
  Use before running any command. Decides whether the agent should run
  it at all — formatters, license annotators, linters, and checkers
  belong to pre-commit hooks, pre-push hooks, and CI; the agent runs
  only its own targeted tests and the one command a failure names — and
  how to run quietly, redirecting long output so only the tail enters
  context.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Running Commands

Every command has one owner: a hook, CI, or the agent. Run only your own
commands, and run them quietly.

## Ownership

| Owner      | Commands                                    | Runs when | Evidence        |
| ---------- | ------------------------------------------- | --------- | --------------- |
| Pre-commit | prettier --write, shfmt, reuse annotate     | commit    | hook exit code  |
| Pre-push   | per-file checkers: shellcheck, eslint-class | push      | hook exit code  |
| CI         | full-repo checkers, typecheck, full suites  | push      | `ghb pr verify` |
| Agent      | targeted tests; the command a failure names | dev loop  | command output  |

## Rules

1. Never run another row's commands standalone. Not before pushing, not
   before claiming done.
2. Run targeted tests: the test being written, the suite touched — a vitest
   path, `gradle --tests`, `mvn -Dtest`. Not the full suite.
3. On hook or CI failure: run the tool on the named file — the checker to
   see it, the fixer to fix it — then retry the git command. This is the
   one standalone path for a fixer: lint-staged missed what the check
   caught.
4. Run what's yours quietly: redirect long output to a mktemp file in the
   harness temp dir, tail on failure. Full patterns — per-tool flags,
   commit output, background waits — live in `references/quiet.md`; read
   it before composing a command with long output.
5. The rules bind the agent's initiative, not the user's word. A named
   command from the user overrides — run it once, say the hook would have.
   Goal phrasing ("clean up the formatting") is not an order; route it
   through the owner: commit, and the hook formats.

## Quiet output

Run what's yours quietly: redirect long output to a mktemp file in the
harness temp dir, tail on failure. Per-tool flags, the commit pattern, and
background waits live in `references/quiet.md` — read it before composing a
command with long output.
