<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Output Hygiene Watch Design

## Intent

Rule 3 of the `output-hygiene` skill blocks the agent's turn behind a
watch command and dies at the harness's 120 s foreground timeout. Its
`gh pr checks --watch` tail costs ~300 tokens per wake. Rework rule 3
around the harness's background notification, and replace gh's table
watch with a filtered poll loop that reports one line.

## Goals

1. Waits run as background shells; the completion notification is the
   wake-up. No sleep-then-check, no foreground timeout.
2. gh PR checks report one line: `pass`, `fail: <names>`, or
   `pending after Nm: <names>`.
3. A stuck check suite cannot hang a session — the wait is bounded.
4. The Maven bullet in `using-xenoterracide-agent-skills` carries `-B`.

## Non-goals

- No generic watch framework. One script, one command: `gh pr checks`.
- No Kimi harness support. Nobody uses it; its base-dir resolution is
  unverified.
- No eval changes. They trigger on prompts, not rule content.

## Constraints

- The plugin stays dependency-free. The script uses gh and coreutils
  only; gh's `--jq` filters, so no jq dependency.
- Pre-commit runs shfmt + shellcheck on `*.sh`; REUSE wants an MIT
  header.
- SKILL.md gains one pointer line, not the loop inline. Skill content
  is injected into context on every load.

## Approaches

| Approach                        | Wake payload         | Cost                        |
| ------------------------------- | -------------------- | --------------------------- |
| A: `--watch` backgrounded, tail | ~300-token table     | none                        |
| B: shipped `gh-pr-wait.sh`      | one line, ~10 tokens | ~50 lines, first `scripts/` |
| C: inline loop in SKILL.md      | one line             | ~100 tokens on every load   |

Picked B. The script keeps SKILL.md lean, gets fail-fast for free
(exit the moment any bucket reads `fail`), bounds the wait, and lands
under shfmt + shellcheck. A stays in the rule text as the fallback when
a harness cannot resolve the skill's base directory.

## Verified behavior

- In JSON mode `gh pr checks` exits 0 on any successful render,
  whatever the check state — the 8-pending / 1-fail exit codes are
  table-mode only (verified live: a PR with failing checks exits 0 with
  `--json`, 1 without). `--json` and `--jq` work without `--watch`;
  `--watch` + `--json` is refused ("cannot use `--watch` with `--json`
  flag"). A successful render always prints the line; all-pass renders
  a bare tab. State must come from the rendered line.
- Maven 3.9.16 and 4.0.0-rc-7, cold repo: `-B` alone leaves 640 and
  506 `Downloading`/`Downloaded` lines; `-ntp` zeroes them. `-B` does
  not imply `-ntp`. Only Maven 4 with `CI=true` auto-quiets (MNG-7338),
  and agent shells do not set `CI`.
- `mvn -B -q -ntp test` with a failing test still prints the failing
  test, assertion, and stack trace — 48 lines vs 87 non-quiet. `-q`
  costs no failure signal.

## Decisions

- Script: `skills/output-hygiene/scripts/gh-pr-wait.sh`. Forwards its
  args to `gh pr checks`; polls every 10 s; exits 0 pass, 1 fail,
  2 still-pending after 30 m; prints the pending or failed check names.
  Derives state from the rendered line, not gh's exit code.
- Rule 3: background + redirect + tail inside the call, so the
  notification carries the result. gh waits go through the script.
  Other watch and poll commands keep the generic pattern.
- Maven bullet: `-B -q --no-transfer-progress`, all three, always.
- Kimi: accepted risk, recorded at design time.

## Left to the builder

- Implement the script; pass shfmt + shellcheck.
- Rewrite SKILL.md rule 3; edit the Maven bullet in
  `using-xenoterracide-agent-skills/SKILL.md`.
- Regenerate the catalog with `pnpm skills:catalog`; ask about a
  version bump before the PR; work on a worktree branch.
