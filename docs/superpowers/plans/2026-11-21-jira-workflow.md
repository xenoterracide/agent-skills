<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Jira Workflow Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move XTC project facts out of skills into a repo config and make the workflow skills generic.

**Architecture:** `.config/agent/project.yaml` holds tracker facts. `schemas/project.schema.json` defines the contract. `jira-workflow` reads the config and uses logical workflow roles. `iterative-development` keeps only the generic loop. XTC-14's description and PR #317 carry the revised spec.

**Tech Stack:** Markdown skills, YAML config, JSON Schema Draft 2020-12, vitest eval helpers, pnpm catalog generator, Atlassian MCP.

**Spec:** `docs/superpowers/specs/2026-11-20-jira-workflow-design.md`

## Global Constraints

- Version stays `26.11.23` in `package.json` and `.kimi-plugin/plugin.json`.
- Do not edit `AGENTS.md`. `jira-workflow` owns `.config/agent/project.yaml`.
- Do not change `use-case-creator` or spec storage layout. Specs stay under
  `docs/superpowers/`. Only the existing design note and this plan are revised.
- Do not change base-template. A follow-up ticket renders config into consumers.
- Config path: `.config/agent/project.yaml`. Schema path: `schemas/project.schema.json`.
- Schema URL in config: `https://raw.githubusercontent.com/xenoterracide/agent-skills/develop/schemas/project.schema.json`.
- License headers: TypeScript GPL-3.0-or-later; Markdown CC-BY-NC-SA-4.0; JSON and YAML CC0-1.0. Pre-commit annotates new files.
- Jira identity is a `project:<repo>` label. No custom field.
- Missing config stops the Jira operation with the path named. No XTC fallback.
- Validate a transition ID against live `listJiraIssueTransitions` before use.
- Plugin stays dependency-free. No YAML parser or JSON Schema validator at runtime.
- Jira stays any-to-any. Intended edges are intent, not enforcement.

## Review Focus

- Missing `.config/agent/project.yaml`. Expected: skill stops and names the path. Pinned by Task 2's skill text gate.
- Configured transition ID is stale. Expected: skill matches `to.name` against configured statuses and uses the live ID. Pinned by Task 2's skill text gate.
- User asks for repo-only XTC work. Expected: add `labels = "project:<repo>"`; board reads otherwise stay project-wide. Pinned by Task 2's skill text gate.
- Old XTC tickets have no project label. Expected: project-wide reads still show them. Pinned by Task 2's skill text gate.
- Bootstrap loads without a config. Expected: it names the tracker workflow skill without claiming XTC behavior. Pinned by Task 4's static gate.

---

### Task 1: Add the config contract

**Files:**

- Create: `schemas/project.schema.json`
- Create: `.config/agent/project.yaml`
- Modify: `scripts/skill-content.test.ts`

**Interfaces:**

- Produces: config keys `repo`, `tracker.kind`, `tracker.project`, `tracker.board`, `tracker.work_types`, `tracker.statuses`, `tracker.transitions`.
- Produces: schema path used by Task 2's config fixture.

- [ ] **Step 1: Write the failing static tests**

Add two cases to `scripts/skill-content.test.ts`:

```ts
it("defines the project config schema", () => {
  const schema = JSON.parse(readFileSync("schemas/project.schema.json", "utf8"));

  expect(schema.required).toEqual(["repo", "tracker"]);
  expect(schema.additionalProperties).toBe(false);
  expect(Object.keys(schema.properties.tracker.properties)).toEqual([
    "kind",
    "skill",
    "site",
    "project",
    "board",
    "work_types",
    "labels",
    "statuses",
    "transitions",
  ]);
});

it("ships the agent-skills project config", () => {
  const text = readFileSync(".config/agent/project.yaml", "utf8");

  expect(text).toContain("xenoterracide/agent-skills/develop/schemas/project.schema.json");
  expect(text).toContain("repo: agent-skills");
  expect(text).toContain("project: XTC");
  expect(text).toContain("board: 3");
  expect(text).toContain("work_types: [Epic, Feature, Task, Bug, Subtask]");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --reporter=silent exec vitest run scripts/skill-content.test.ts -t "project config"`
Expected: FAIL — schema and config files missing.

- [ ] **Step 3: Create the schema**

Create `schemas/project.schema.json`:

- `$schema`: `https://json-schema.org/draft/2020-12/schema`
- `$id`: the schema URL from Global Constraints
- `type: object`, `required: ["repo", "tracker"]`, `additionalProperties: false`
- `properties.repo`: string
- `properties.tracker`: object with `additionalProperties: false`
- `properties.tracker.required`: `kind`, `skill`, `site`, `project`, `board`,
  `work_types`, `labels`, `statuses`, `transitions`. The skills read all nine.
  Declare `properties.tracker.properties` in this exact order so the Step 1 key
  assertion holds:

- `kind`: `const: "jira"`
- `skill`: string
- `site`: string
- `project`: string
- `board`: integer
- `work_types`: array of strings
- `labels`: object with `project_prefix: string`
- `statuses`: object with required roles `captured`, `refining`, `ready`, `building`, `reviewing`, `done`, `dropped`; each string
- `transitions`: object with integer values; required keys match the spec's edge names

Do not add a `spec` property.

- [ ] **Step 4: Create the config**

Create `.config/agent/project.yaml` with the exact schema comment from Global Constraints and the values in the spec's Config schema section. Omit the old `spec:` block.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --reporter=silent exec vitest run scripts/skill-content.test.ts`
Expected: PASS — all cases green.

- [ ] **Step 6: Commit**

```bash
git add schemas/project.schema.json .config/agent/project.yaml scripts/skill-content.test.ts
git commit -m "feat: define project config contract"
```

### Task 2: Rewrite `jira-workflow` around the config

**Files:**

- Modify: `skills/jira-workflow/SKILL.md`
- Modify: `skills/jira-workflow/references/issue-content.md`
- Modify: `skills/jira-workflow/tests/evals.test.ts`
- Create: `skills/jira-workflow/tests/fixtures/project-config/.config/agent/project.yaml`
- Modify: `scripts/skill-content.test.ts`

**Interfaces:**

- Consumes: config keys from Task 1.
- Consumes: `fixture` option on `assertSkillBehavior`.
- Produces: skill `jira-workflow` with no project constants in `SKILL.md` or `references/*.md`.

- [ ] **Step 1: Write the failing eval case**

In `skills/jira-workflow/tests/evals.test.ts`, add:

```ts
it("reads the project config before Jira work", () => {
  assertSkillBehavior("show me the Jira board for this repo", "jira-workflow", {
    first: true,
    fixture: "skills/jira-workflow/tests/fixtures/project-config",
    reads: [".config/agent/project.yaml"],
  });
});
```

Change the five existing prompts to use Jira terms instead of XTC terms or keys. Keep their case names.

- [ ] **Step 2: Write the failing static gates**

Add cases to `scripts/skill-content.test.ts`:

- `jira-workflow/SKILL.md` does not contain `XTC`, `board: 3`, `fc5ce4e3-4638-4a37-9aaf-1a2591482c2e`, or backticked values `Added to backlog`, `Open`, `To Do`, `In Progress`, `In Review`, `Done`, `Canceled`.
- Every file under `skills/jira-workflow/references/` does not contain `XTC` or `fc5ce4e3-4638-4a37-9aaf-1a2591482c2e`.
- `skills/jira-workflow/SKILL.md` contains `.config/agent/project.yaml`, `stops`, `listJiraIssueTransitions`, `to.name`, `labels =`, and `project-wide`.

- [ ] **Step 3: Run the tests to verify they fail**

Run the eval case with the fixture and the static file:

```bash
EVAL_MODEL=opencode/big-pickle EVAL_ITERATIONS=1 pnpm exec vitest run skills/jira-workflow/tests/evals.test.ts -t "project config"
pnpm --reporter=silent exec vitest run scripts/skill-content.test.ts -t "jira-workflow"
```

Expected: both FAIL. The eval misses the fixture read. The static gates find project constants.

- [ ] **Step 4: Create the eval fixture**

Copy Task 1's config into `skills/jira-workflow/tests/fixtures/project-config/.config/agent/project.yaml`. Let pre-commit add the YAML license header.

- [ ] **Step 5: Rewrite the skill**

In `skills/jira-workflow/SKILL.md`:

- Keep frontmatter `name: jira-workflow`. Description starts `Use when` and carries Jira, issue, ticket, status, board, backlog, Subtask. Do not use XTC.
- Open with `Read .config/agent/project.yaml before Jira work. If missing, stop and name the path.`
- Replace the concrete status diagram with role names from the config. State
  that Jira is any-to-any and mark edges out of `captured` and `refining` as
  intent and unverified.
- Replace the concrete status table with role-to-config mapping.
- State: board reads stay project-wide. Add `AND labels = "project:<repo>"` only when the user scopes to one repo.
- State: work types come from `tracker.work_types`.
- State: new work starts in `captured` and gets `project:<repo>`.
- State: read, create, update, move operations. Move uses `listJiraIssueTransitions`; use a configured ID only when its `to.name` matches the configured status, otherwise match by name.
- Keep `issue-content.md` as the source for description, status field, and comment ownership.
- Keep `hemingway` as required companion.

In `skills/jira-workflow/references/issue-content.md`, remove the closing line `XTC is the tracker.` Keep the four ownership rules.

- [ ] **Step 6: Run the tests to verify they pass**

```bash
EVAL_MODEL=opencode/big-pickle EVAL_ITERATIONS=1 pnpm exec vitest run skills/jira-workflow/tests/evals.test.ts
pnpm --reporter=silent exec vitest run scripts/skill-content.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add skills/jira-workflow scripts/skill-content.test.ts
git commit -m "feat: make jira-workflow config-driven"
```

### Task 3: Make `iterative-development` tracker-agnostic

**Files:**

- Modify: `skills/iterative-development/SKILL.md`
- Modify: `skills/iterative-development/tests/evals.test.ts`
- Delete: `skills/iterative-development/references/jira-iteration.md`
- Modify: `scripts/skill-content.test.ts`

**Interfaces:**

- Consumes: nothing from Task 2. `iterative-development` must not call `jira-workflow` by name.
- Produces: generic iteration loop with no tracker constants.

- [ ] **Step 1: Write the failing tests**

Add a generic eval case to `skills/iterative-development/tests/evals.test.ts`:

| Case              | Prompt                                                         |
| ----------------- | -------------------------------------------------------------- |
| iteration-generic | `plan the next iteration and break it into tracker work items` |

Add static cases to `scripts/skill-content.test.ts`:

- No Markdown under `skills/iterative-development` contains `XTC`, `Jira`, `jira-iteration`, or `Subtask`.
- `skills/iterative-development/references/jira-iteration.md` does not exist.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
EVAL_MODEL=opencode/big-pickle EVAL_ITERATIONS=1 pnpm exec vitest run skills/iterative-development/tests/evals.test.ts -t "iteration-generic"
pnpm --reporter=silent exec vitest run scripts/skill-content.test.ts -t "iterative-development"
```

Expected: both FAIL.

- [ ] **Step 3: Make the skill generic**

In `skills/iterative-development/SKILL.md`:

- Replace the XTC branch with: `Record work breakdown in the tracker.`
- Remove `jira-iteration.md` and the `jira-workflow` bullet from Integration.
  Keep `use-case-creator`, `testing`, and `coding-standards`.
- Remove any XTC, Jira, and Subtask wording.
- Keep the whirlpool principles, anti-patterns, and AI role sections unchanged.

Delete `skills/iterative-development/references/jira-iteration.md`.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
EVAL_MODEL=opencode/big-pickle EVAL_ITERATIONS=1 pnpm exec vitest run skills/iterative-development/tests/evals.test.ts
pnpm --reporter=silent exec vitest run scripts/skill-content.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A skills/iterative-development scripts/skill-content.test.ts
git commit -m "refactor: make iterative development generic"
```

### Task 4: Update the ticket, bootstrap, catalog, and PR

**Files:**

- Modify: `skills/using-xenoterracide-agent-skills/SKILL.md`
- Modify: `skills/index.json`
- Modify: XTC-14 description and labels through Atlassian MCP

**Interfaces:**

- Consumes: all three implementation tasks.
- Produces: release-ready branch and updated XTC-14.

- [ ] **Step 1: Write the failing bootstrap gate**

Add a static case to `scripts/skill-content.test.ts`:

- `skills/using-xenoterracide-agent-skills/SKILL.md` does not contain `XTC`.
- It contains `.config/agent/project.yaml`.

Run:

```bash
pnpm --reporter=silent exec vitest run scripts/skill-content.test.ts -t "bootstrap"
```

Expected: FAIL.

- [ ] **Step 2: Update the bootstrap pointer**

Replace the old bullet with:

`Use the tracker workflow skill named in .config/agent/project.yaml for issue operations.`

Do not copy workflow rules into the bootstrap.

- [ ] **Step 3: Update XTC-14**

Via Atlassian MCP:

- Replace the description with the approved design's spec sections only. Keep intent, config schema, schema, decisions, tests, non-goals, and goals. Omit current status and progress prose.
- Read current labels. Set the full label list with `project:agent-skills` added and `now`, `next`, and `squirrel` removed. Do this for XTC-14 only; bulk backfill is out of scope.
- Append a short implementation-discovery note to comment `10003`. Do not paste the full design.

- [ ] **Step 4: Regenerate the catalog**

Run: `pnpm --reporter=silent skills:catalog`
Expected: `skills/index.json` reflects the removed Jira iteration reference and stays at version `26.11.23`.

- [ ] **Step 5: Verify**

```bash
pnpm --reporter=silent exec vitest run scripts/skill-content.test.ts
git -C . status --porcelain=v1 --branch
```

Expected: static tests PASS; worktree has no unexpected files.

- [ ] **Step 6: Commit, push, and verify**

```bash
git add skills/using-xenoterracide-agent-skills skills/index.json docs/superpowers scripts/skill-content.test.ts
git commit -m "docs: move XTC facts into project config"
git push --quiet
ghb pr verify
```

Expected: checks pass. Show `[agent-skills#317](https://github.com/xenoterracide/agent-skills/pull/317)`. Keep the PR ready. Move XTC-14 to `Done` only after the maintainer says yes and checks stay green.

- [ ] **Step 7: Open the follow-up ticket**

Create an XTC ticket for base-template to render `.config/agent/project.yaml` and the `AGENTS.md` pointer into consumers. Leave it in `Added to backlog`.
