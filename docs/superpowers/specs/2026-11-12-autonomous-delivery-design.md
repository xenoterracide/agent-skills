<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Autonomous Delivery Design

## Intent

Agents ask before opening a pull request. The question has one answer, and
waiting for it stalls the work. Opening the PR belongs to the agent. The merge
stays with the human.

Some repositories gate their expensive tests behind "ready". A draft PR runs
the cheap checks. The agent settles those, flips to ready, then settles the
expensive set.

## Goals

1. Commit each completed logical step and push it.
2. Open the pull request as a draft without asking.
3. Watch the draft checks. When they pass, mark the PR ready.
4. Watch the checks that "ready" releases. Then report the URL, head SHA, and
   green checks.
5. Never merge. The human's yes still gates the merge.
6. Omit an ungrounded why. Do not ask for one.

## Non-goals

- Changing merge policy.
- Changing how incoming review comments are handled.

## Anti-goals

- Merging, or arming auto-merge, without the human's yes.
- One commit at the end of a long task.
- A fabricated why in permanent history.

## Approaches

- **A. Bootstrap rule, `git-workflow` mechanics, `commit-creator` wording —
  chosen.** The bootstrap is the one text every session reads, so the standing
  rule lives there. `git-workflow` carries the commands. `commit-creator` owns
  the why.
- **B. `git-workflow` only — rejected.** The prompt to ask comes from the
  session, not from the PR reference. A rule buried in one reference does not
  reach it.
- **C. Bootstrap only — rejected.** No commands, no check sequence.

## Design

### `skills/using-xenoterracide-agent-skills/SKILL.md`

`Plans and Execution` gains the delivery rule:

- Commit each completed step and push it.
- Open the PR as a draft once the first step is pushed. Do not ask.
- When the draft checks pass, mark the PR ready with `gh pr ready`.
- Watch the checks that "ready" releases.
- Report the URL, head SHA, and green checks. Merge still waits for the human.

`Merging`, and the unchanged list of actions that stop and ask, keep their
current wording.

### `skills/git-workflow/references/pull-request.md`

- Shared rules: commit each completed logical step and push it. Open the draft
  PR when the first commit is pushed.
- Workflow step 4 creates the PR with `gh pr create --draft`.
- New subsection, `Draft, Ready, and Checks`:
  - Draft checks are the cheap gate.
  - When they pass, run `gh pr ready <n>`.
  - Then watch the full check set, which now includes the expensive suites.
  - Report the URL and head SHA once they pass.
  - A fix after ready stays on the same PR; push the commit.

### `skills/git-workflow/references/commit-creator.md`

- Add the design doc or plan the change implements as a why source, cited by
  path.
- Replace "ask the user for one line, or omit" with "omit it": no question.

### Evals

- `skills/code-review/tests/evals.test.ts` asserts `github` loads as a
  companion on the PR review prompt.
- `skills/git-workflow/tests/evals.test.ts` asserts the PR creation command
  carries `--draft`.
- Evals run on demand, never in CI.

### Registration

Run `pnpm skills:catalog`. Ask whether to bump `.kimi-plugin/plugin.json` and
`package.json`.

## Left to the builder

- Wording of both rule sets.
- Placement of the ready loop inside `pull-request.md`.
- Which eval assertions stay stable across models.
