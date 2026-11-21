# Jira Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add XTC workflow skills to `agent-skills` and route iterative work through Jira Subtasks.

**Architecture:** `jira-workflow` owns the XTC state diagram, status meanings, and issue operations. `iterative-development` owns the iteration loop. `use-case-creator` records spec placement. The bootstrap adds one pointer. Catalog and version files finish the release.

**Tech Stack:** Markdown skills, vitest eval helpers, pnpm catalog generator.

**Spec:** `docs/superpowers/specs/2026-11-20-jira-workflow-design.md`

## Global Constraints

- Version: `26.11.23` in `package.json` and `.kimi-plugin/plugin.json`.
- Skill frontmatter: `---` is the first line. `description` starts with `Use when`.
- SPDX HTML comment sits immediately after frontmatter. License `CC-BY-NC-SA-4.0`.
- Statuses: `Added to backlog`, `Open`, `To Do`, `In Progress`, `In Review`, `Done`, `Canceled`.
- No `Spec`, `Ready`, or `Plan` work type. No `now`, `next`, `squirrel` labels.
- Specs live in the ticket description and in the repo. Use cases stay deferred.
- XTC-13 owns repo classification. XTC-15 owns the Superpowers decision.
- Jira stays any-to-any. The skill describes intended edges as intent, not enforcement.

## Review Focus

- A ticket in `Open` with an unfinished description. Expected: agent refines the spec, does not create Subtasks. Pinned by Task 1's skill text check.
- A ticket in `To Do` with no work breakdown. Expected: agent creates Subtasks before moving to `In Progress`. Pinned by Task 2's skill text check.
- A spec that crosses UX and code. Expected: agent places it at the UX level and records the open question. Pinned by Task 3's skill text check.
- Edges out of `Added to backlog` and `Open`. Expected: agent labels them intent, not verified Jira transitions. Pinned by Task 1's skill text check.
- A session that loads the bootstrap only. Expected: it points to `jira-workflow` without duplicating the state model. Pinned by Task 3's skill text check.

---

### Task 1: Add `jira-workflow` skill

**Files:**

- Create: `skills/jira-workflow/SKILL.md`
- Create: `skills/jira-workflow/tests/evals.test.ts`

**Interfaces:**

- Produces: skill `jira-workflow`; eval file loadable by `pnpm evals`.

- [ ] **Step 1: Write the failing eval**

Create `skills/jira-workflow/tests/evals.test.ts` with GPL header, `assertSkillBehavior` import, and four cases:

| Case           | Prompt                                           |
| -------------- | ------------------------------------------------ |
| read state     | `show me what's in the XTC board right now`      |
| create issue   | `create an XTC task to audit Renovate PRs`       |
| move status    | `move XTC-14 from Open to To Do`                 |
| work breakdown | `turn this XTC plan into Subtasks on the ticket` |

Assert load for each. Use `first: true` on the read-state case.

- [ ] **Step 2: Run the eval to verify it fails**

Run: `EVAL_ITERATIONS=1 pnpm exec vitest run skills/jira-workflow/tests/evals.test.ts`
Expected: FAIL — skill `jira-workflow` not found.

- [ ] **Step 3: Write the skill**

Create `skills/jira-workflow/SKILL.md`. Frontmatter `name: jira-workflow`, `description` starting `Use when` with triggers: XTC, Jira, issue, ticket, status, board, backlog, Subtask. Body carries:

- state Mermaid diagram from the spec
- status table from the spec
- note that edges out of `Added to backlog` and `Open` are intent, not verified
- one section each for read, create, update, and move operations
- rule: no Subtasks in `Open`; work breakdown happens in `To Do`
- `hemingway` in Required Companion Skills

- [ ] **Step 4: Run the eval to verify it passes**

Run: `EVAL_ITERATIONS=1 pnpm exec vitest run skills/jira-workflow/tests/evals.test.ts`
Expected: PASS — all four cases load the skill.

- [ ] **Step 5: Check the skill text pins the Review Focus rules**

Run: `rg -n 'intent|To Do|Subtasks|Added to backlog' skills/jira-workflow/SKILL.md`
Expected: matches for the intent note, the `To Do` Subtask rule, and `Added to backlog`.

- [ ] **Step 6: Commit**

```bash
git add skills/jira-workflow
git commit -m "feat: add jira-workflow skill"
```

### Task 2: Add the iteration loop to `iterative-development`

**Files:**

- Modify: `skills/iterative-development/SKILL.md`
- Modify: `skills/iterative-development/tests/evals.test.ts`

**Interfaces:**

- Consumes: `jira-workflow` status model from Task 1.
- Produces: no new interface.

- [ ] **Step 1: Write the failing eval case**

Add one case to `skills/iterative-development/tests/evals.test.ts`:

| Case      | Prompt                                                                       |
| --------- | ---------------------------------------------------------------------------- |
| iteration | `set up the first iteration for this XTC feature and break it into Subtasks` |

Assert load. Keep existing cases unchanged.

- [ ] **Step 2: Run the eval to verify it fails**

Run: `EVAL_ITERATIONS=1 pnpm exec vitest run skills/iterative-development/tests/evals.test.ts -t "iteration"`
Expected: FAIL — no case with that name.

- [ ] **Step 3: Add the loop to the skill**

In `skills/iterative-development/SKILL.md`, insert a `## Jira Iteration Loop` section after `## Iteration Rhythm`. Carry the loop diagram from the spec. State: spec in ticket, spec committed, work breakdown in `To Do`, Subtasks in Jira, build test-first, PR, merge green, reflect, next iteration. Keep the existing principles and anti-patterns untouched. Add `jira-workflow` to Integration.

- [ ] **Step 4: Run the eval to verify it passes**

Run: `EVAL_ITERATIONS=1 pnpm exec vitest run skills/iterative-development/tests/evals.test.ts -t "iteration"`
Expected: PASS.

- [ ] **Step 5: Check the Subtask rule**

Run: `rg -n 'To Do|Subtasks|test-first' skills/iterative-development/SKILL.md`
Expected: matches for all three.

- [ ] **Step 6: Commit**

```bash
git add skills/iterative-development
git commit -m "feat: add Jira iteration loop"
```

### Task 3: Record spec placement and add the bootstrap pointer

**Files:**

- Modify: `skills/use-case-creator/SKILL.md`
- Create: `skills/use-case-creator/tests/evals.test.ts`
- Modify: `skills/using-xenoterracide-agent-skills/SKILL.md`

**Interfaces:**

- Consumes: none.
- Produces: no new interface.

- [ ] **Step 1: Write the failing eval**

Create `skills/use-case-creator/tests/evals.test.ts` with GPL header and one case:

| Case      | Prompt                                                            |
| --------- | ----------------------------------------------------------------- |
| placement | `where should a UX-level use case live when it affects code too?` |

Assert load.

- [ ] **Step 2: Run the eval to verify it fails**

Run: `EVAL_ITERATIONS=1 pnpm exec vitest run skills/use-case-creator/tests/evals.test.ts`
Expected: FAIL — no eval file.

- [ ] **Step 3: Update `use-case-creator`**

Replace `## Output Format` with a placement rule: specs live in the ticket description and in the repo; keep `docs/use-cases/` as the default directory; a spec goes at the highest visible level it applies to; a UX spec lives at UX level even when it reaches down into code. Record the dedicated-repo question as a long-term open issue. Delete the AI-specific anchor claim; keep anchors for referenced steps.

- [ ] **Step 4: Add the bootstrap pointer**

In `skills/using-xenoterracide-agent-skills/SKILL.md`, add one bullet under `## Using the skills`: `Use jira-workflow for XTC state and issue operations.` Do not copy the state model into the bootstrap.

- [ ] **Step 5: Run the eval to verify it passes**

Run: `EVAL_ITERATIONS=1 pnpm exec vitest run skills/use-case-creator/tests/evals.test.ts`
Expected: PASS.

- [ ] **Step 6: Check the placement rule**

Run: `rg -n 'highest visible level|long-term|jira-workflow' skills/use-case-creator/SKILL.md skills/using-xenoterracide-agent-skills/SKILL.md`
Expected: matches for the placement rule, the open question, and the pointer.

- [ ] **Step 7: Commit**

```bash
git add skills/use-case-creator skills/using-xenoterracide-agent-skills
git commit -m "feat: record spec placement and workflow pointer"
```

### Task 4: Regenerate the catalog and verify

**Files:**

- Modify: `skills/index.json`
- Modified earlier in this branch: `package.json`, `.kimi-plugin/plugin.json`

**Interfaces:**

- Consumes: all three skill tasks.
- Produces: release-ready branch.

- [ ] **Step 1: Regenerate the catalog**

Run: `pnpm skills:catalog`
Expected: `skills/index.json` updated with `jira-workflow` and version `26.11.23`.

- [ ] **Step 2: Check the catalog**

Run: `pnpm skills:check`
Expected: PASS, no drift.

- [ ] **Step 3: Run the checks**

Run: `pnpm check`
Expected: PASS — typecheck, eslint, catalog, and tests. Fix failures the command names.

- [ ] **Step 4: Verify the versions**

Run: `rg -n '"version"' package.json .kimi-plugin/plugin.json`
Expected: both `26.11.23`.

- [ ] **Step 5: Commit**

```bash
git add skills/index.json package.json .kimi-plugin/plugin.json docs/superpowers
git commit -m "chore: regenerate skill catalog and bump version"
```

- [ ] **Step 6: Push and open the draft PR**

Run: `git push --quiet -u origin feat/jira-workflow`, then create the draft PR. Show `[agent-skills#NNN](url)` to the maintainer. Wait for the explicit yes before merging.

- [ ] **Step 7: Move XTC-14 to `In Review`**

After the PR opens, call `transitionJiraIssue` for XTC-14 with transition name `In Review`. Do not move it to `Done` until merge and green checks.
