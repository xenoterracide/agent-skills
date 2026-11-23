<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Merge Cleanup Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make an approved merge move the session out of the feature worktree and delete both branches.

**Architecture:** Put a conditional gate in the injected bootstrap, add a merge row to the `git-workflow` routing table, and prove both with behavioral evals. Detailed procedure stays in `pull-request.md`.

**Tech Stack:** Markdown skills, vitest eval helpers, pnpm.

**Spec:** `docs/superpowers/specs/2026-11-23-merge-cleanup-gate-design.md`

## Global Constraints

- Version `26.11.24` in `.kimi-plugin/plugin.json` and `package.json`.
- Regenerate the catalog with `pnpm skills:catalog`.
- No text assertions against skill files. Test the consuming agent.
- SPDX headers on new Markdown files. Prettier on changed files via hook.
- Run evals with `OPENCODE_SESSION_ID` unset. Otherwise the sandbox agent
  reads the host worktree and the plan.

## Review Focus

- Worktree rule question: no merge route, move-out prose. Both skills.
- Main-worktree turn: `gh pr merge <PR> --squash --delete-branch`. `git-workflow` case.
- Approval with no repo: no merge attempted. Existing `git-workflow` cases.
- `git-workflow` routes merge prompts to `pull-request.md`. Main-worktree case.

---

### Task 1: Failing evals for the approved merge

**Files:**

- Modify: `skills/git-workflow/tests/evals.test.ts`
- Modify: `skills/using-xenoterracide-agent-skills/tests/evals.test.ts`

**Interfaces:**

- Consumes: `assertSkillBehavior(prompt, skill, options)` from `scripts/eval-helpers.ts`.
- Produces: three cases — a worktree-rule case per skill and one main-worktree merge case.

- [x] **Step 1: Add the worktree-stop cases**

In `skills/git-workflow/tests/evals.test.ts`, add
`moves out of a worktree before merging, from git-workflow`. Prompt asks
what must happen before an approved merge when the session is in a feature
worktree. Options: `repo: true`, `ghb: "green"`, `reads: [/pull-request\.md/]`,
the full merge-route `forbids`, and move-out prose.

In `skills/using-xenoterracide-agent-skills/tests/evals.test.ts`, add the
matching `moves out of a worktree before merging, from the bootstrap` case
without `reads`. A question keeps the case independent of the sandbox cwd.

- [x] **Step 2: Add the main-worktree merge cases**

Add `merges an approved PR with branch cleanup` in
`skills/git-workflow/tests/evals.test.ts`. Prompt says the session is in
the main worktree. Options: `repo: true`, `ghb: "green"`,
`reads: [/pull-request\.md/]`, and
`commands: [/gh pr merge\b[^\n]*--squash[^\n]*--delete-branch/]`. A "merge
it" prompt routes to `git-workflow`, so the command belongs in that case.

- [x] **Step 3: Run the cases and watch the bootstrap gate fail**

```bash
env -u OPENCODE_SESSION_ID EVAL_ITERATIONS=1 EVAL_MODEL=opencode/big-pickle pnpm exec vitest run skills/git-workflow/tests/evals.test.ts skills/using-xenoterracide-agent-skills/tests/evals.test.ts -t "worktree before merging|approved PR with branch cleanup" --reporter=verbose
```

Expected before the gate: the bootstrap case fails on missing move-out and
turn-boundary prose. The `git-workflow` case already read the reference and
passed.

- [x] **Step 4: Commit the failing tests**

```bash
git commit -m "test: gate the approved merge on branch cleanup"
```

### Task 2: Skill gates, version, catalog

**Files:**

- Modify: `skills/git-workflow/SKILL.md`
- Modify: `skills/using-xenoterracide-agent-skills/SKILL.md`
- Modify: `.kimi-plugin/plugin.json`
- Modify: `package.json`
- Modify: `skills/index.json` (generated)

**Interfaces:**

- Consumes: cases from Task 1.
- Produces: the gate that makes the cases pass.

- [x] **Step 1: Add the merge row to the routing table**

In `skills/git-workflow/SKILL.md`, add a row to the table under "Read the
reference that matches the task before starting": task `Merge an approved PR`,
read `references/pull-request.md`.

- [x] **Step 2: Add the bootstrap gate**

In `skills/using-xenoterracide-agent-skills/SKILL.md`, under `## Merging`,
after the consent paragraph: in a feature worktree, move out with
`session_move`. The move lands next turn. End the turn. Merge from the main
worktree next turn with `gh pr merge <PR> --squash --delete-branch`. Point to
`git-workflow` for the full rule.

- [x] **Step 3: Run the cases and watch them pass**

```bash
env -u OPENCODE_SESSION_ID EVAL_ITERATIONS=1 EVAL_MODEL=opencode/big-pickle pnpm exec vitest run skills/git-workflow/tests/evals.test.ts skills/using-xenoterracide-agent-skills/tests/evals.test.ts -t "worktree before merging|approved PR with branch cleanup" --reporter=verbose
```

Expected: PASS.

- [x] **Step 4: Bump the version and regenerate the catalog**

Set both version fields to `26.11.24`. Run `pnpm skills:catalog`.

- [x] **Step 5: Commit**

```bash
git commit -m "feat: gate approved merges on worktree cleanup"
```

### Task 3: Review fixes

- [x] Add the turn boundary to the bootstrap gate.
- [x] Split the contradictory same-turn worktree merge cases.
- [x] Assert both cleanup flags in a main-worktree turn.
- [x] Forbid every merge route in the worktree cases.
- [x] Require the turn boundary in worktree case prose.
