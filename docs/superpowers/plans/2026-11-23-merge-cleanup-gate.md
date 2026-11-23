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

## Review Focus

- Approval turn in a feature worktree: agent states it must move out before merging. Bootstrap eval.
- Approved merge command carries both `--squash` and `--delete-branch`. Both evals.
- Approval with no repo: no merge attempted. Existing `git-workflow` cases.
- `git-workflow` still routes merge prompts to `pull-request.md`. New `git-workflow` eval.
- No raw merge that leaves the local branch behind. Command assertion in both evals.

---

### Task 1: Failing evals for the approved merge

**Files:**

- Modify: `skills/git-workflow/tests/evals.test.ts`
- Modify: `skills/using-xenoterracide-agent-skills/tests/evals.test.ts`

**Interfaces:**

- Consumes: `assertSkillBehavior(prompt, skill, options)` from `scripts/eval-helpers.ts`. `options.repo`, `options.ghb`, `options.reads`, `options.commands`, `options.prose`.
- Produces: two named eval cases for the gate.

- [ ] **Step 1: Add the `git-workflow` approved-merge case**

Append a case named `merges an approved PR with branch cleanup`. Prompt:
`The human approved PR #7. The session is in a feature worktree. Merge it.`
Options: `repo: true`, `ghb: "green"`, `reads: [/pull-request\.md/]`,
`commands: [/gh pr merge\b[^\n]*--squash[^\n]*--delete-branch/]`,
`prose: { includes: [/main worktree|session_move/] }`.

- [ ] **Step 2: Add the bootstrap approved-merge case**

Append a case named `merges an approved PR with branch cleanup from the bootstrap`.
Prompt: `Which skill should I use? The human approved PR #7. The session is in a feature worktree. Merge it.`
Skill: `using-xenoterracide-agent-skills`. Options: `repo: true`,
`ghb: "green"`, `commands: [/gh pr merge\b[^\n]*--squash[^\n]*--delete-branch/]`,
`prose: { includes: [/main worktree|session_move/] }`.

- [ ] **Step 3: Run both cases and watch them fail**

```bash
EVAL_ITERATIONS=1 EVAL_MODEL=opencode/big-pickle pnpm exec vitest run skills/git-workflow/tests/evals.test.ts skills/using-xenoterracide-agent-skills/tests/evals.test.ts -t "approved PR with branch cleanup" --reporter=verbose
```

Expected: FAIL. The command assertion misses `--delete-branch`; the prose
assertion misses the move-out statement.

- [ ] **Step 4: Commit the failing tests**

```bash
git add skills/git-workflow/tests/evals.test.ts skills/using-xenoterracide-agent-skills/tests/evals.test.ts
git commit -m "test: gate the approved merge on branch cleanup"
```

### Task 2: Skill gates, version, catalog

**Files:**

- Modify: `skills/git-workflow/SKILL.md:26-33`
- Modify: `skills/using-xenoterracide-agent-skills/SKILL.md:32-37`
- Modify: `.kimi-plugin/plugin.json`
- Modify: `package.json`
- Modify: `skills/index.json` (generated)

**Interfaces:**

- Consumes: cases from Task 1.
- Produces: the gate that makes the cases pass.

- [ ] **Step 1: Add the merge row to the routing table**

In `skills/git-workflow/SKILL.md`, add a row to the table under "Read the
reference that matches the task before starting": task `Merge an approved PR`,
read `references/pull-request.md`.

- [ ] **Step 2: Add the bootstrap gate**

In `skills/using-xenoterracide-agent-skills/SKILL.md`, under `## Merging`,
after the consent paragraph, add: if the session runs in a feature worktree,
move it out first with `session_move`. Merge from the main worktree with
`gh pr merge <PR> --squash --delete-branch`. Point to `git-workflow` for the
full rule. Keep it under 20 words per instruction.

- [ ] **Step 3: Run the two cases and watch them pass**

```bash
EVAL_ITERATIONS=1 EVAL_MODEL=opencode/big-pickle pnpm exec vitest run skills/git-workflow/tests/evals.test.ts skills/using-xenoterracide-agent-skills/tests/evals.test.ts -t "approved PR with branch cleanup" --reporter=verbose
```

Expected: PASS.

- [ ] **Step 4: Bump the version and regenerate the catalog**

Set both version fields to `26.11.24`. Run `pnpm skills:catalog`.

- [ ] **Step 5: Commit**

```bash
git add skills/git-workflow/SKILL.md skills/using-xenoterracide-agent-skills/SKILL.md .kimi-plugin/plugin.json package.json skills/index.json
git commit -m "feat: gate approved merges on worktree cleanup"
```
