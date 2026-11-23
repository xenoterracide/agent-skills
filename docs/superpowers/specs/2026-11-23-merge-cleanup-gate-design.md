<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Merge Cleanup Gate Design

## Intent

On approval, the agent must move the session out of the feature worktree,
then merge with `gh pr merge <PR> --squash --delete-branch`. The rule already
exists in `skills/git-workflow/references/pull-request.md`. A fresh session
still merged from the feature worktree. `gh` skipped local cleanup. The
operator removed the worktree and branch by hand.

Causes:

1. `skills/git-workflow/SKILL.md` routes PR work to `pull-request.md`, but
   has no row for merging. The description promises merges; the table does
   not.
2. `skills/using-xenoterracide-agent-skills/SKILL.md` covers consent only.
   OpenCode injects it into the first message of every session. It carries
   no merge mechanics.
3. `skills/git-workflow/tests/evals.test.ts` forbids every merge. No case
   asserts the approved merge command.

## Goals

1. A fresh session that receives approval moves out of the worktree before
   merging.
2. The merge command includes `--squash --delete-branch`.
3. The detailed procedure stays in `pull-request.md`. The bootstrap carries
   one gate line. Each rule has one home.
4. Evals assert the behavior through the consuming agent.

## Non-goals

- No new skill.
- No hook or wrapper that executes merges.
- No change to the consent rule or to `pull-request.md`.
- No text-grep tests of skill files. `writing-good-tests` rejects change
  detectors.

## Constraints

- Bump CalVer `26.11.23` to `26.11.24` in `.kimi-plugin/plugin.json` and
  `package.json`.
- Regenerate `skills/index.json` with `pnpm skills:catalog`.
- Keep SPDX headers and Prettier formatting.

## Approaches

1. Add a merge row to the `git-workflow` routing table. Rejected: still
   depends on `git-workflow` winning the trigger at the approval turn.
2. Add the gate to the injected bootstrap, plus the routing row. Chosen:
   the bootstrap is in context in every fresh session.
3. Option 2 plus two behavioral evals. Chosen: adds regression proof at the
   point of failure.

## Design

The bootstrap "Merging" section gains one conditional keyed to the observed
worktree: if the session runs in a feature worktree, move it out first. Then
merge from the main worktree with `--squash --delete-branch`. It points to
`git-workflow` for the full rule.

The `git-workflow` routing table gains a merge row pointing to
`references/pull-request.md`.

Two eval cases use an approved prompt. The `git-workflow` case requires the
reference read and the merge command. The bootstrap case requires the merge
command and a move-out statement. Both run against the sandbox `gh` stub,
which logs commands without reaching the network.
