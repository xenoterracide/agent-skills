<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Skill Evals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent prompt regression suite — `evals.yaml` plus a runner — that verifies skills auto-load and their rules apply across models.

**Architecture:** `evals.yaml` holds a `models` list and `tests` (each `{name, prompt, expect}`). `scripts/run-evals.mjs` reads it, forks a fresh `opencode run` session per `(test, model)` × `iterations`, judges each output (LLM judge for `type: skill`, string match for `type: contains`), and reports a `(test, model) → passed M/N` matrix. Wired as `yarn evals`, on-demand (not CI).

**Tech Stack:** Node (`.mjs`), the `yaml` package for parsing, `opencode run` for forking sessions.

**Spec:** `docs/superpowers/specs/2026-11-01-skill-evals-design.md`.

## Global Constraints

- The runner forks a full session (`opencode run`), never a subagent — subagents lack the skill tool.
- Skill invocation passes only at 3/3 runs; a flaky trigger is a failure.
- Results are printed, not committed; `evals.yaml` and the runner are committed.
- `scripts/*.mjs` files are MIT-licensed; `*.yaml` is CC0-1.0 (per `AGENTS.md` licensing table).
- The runner is a dev tool, not the plugin entrypoint, so it may use devDependencies.
- `yarn lint` and `yarn test` must still pass.

## Review Focus

- **The runner must fork, not subagent** — a subagent cannot observe skill auto-loading.
- **The 3/3 threshold must be enforced** — a single failure must fail the case, not average out.
- **`type: contains` must not require a model** — it is a plain string match, cheap and deterministic.
- **The judge must be asked a yes/no question** — to reduce its own non-determinism.
- **`evals.yaml` must not be wired into CI** — it forks sessions and costs tokens.

---

### Task 1: Add the `yaml` devDependency

**Files:**

- Modify: `package.json`
- Modify: `yarn.lock` (via install)

- [ ] **Step 1: Add the dependency**

Run: `yarn add -D yaml`
Expected: `yaml` is added to `devDependencies` and `yarn.lock` updates.

- [ ] **Step 2: Commit**

```bash
git add package.json yarn.lock
git commit -m "build: add yaml devDependency for the evals runner"
```

---

### Task 2: Create `evals.yaml`

**Files:**

- Create: `evals.yaml`

- [ ] **Step 1: Write the schema and initial cases**

Create `evals.yaml` with a `models` list, `iterations: 3`, and a small `tests`
list. Include at least one `type: skill` case and one `type: contains` case.
Use real, non-toy prompts (the `var foo` example is a placeholder, not a real
case).

- [ ] **Step 2: Format and verify**

Run: `yarn exec prettier --write evals.yaml`
Expected: no diff after a second run.

- [ ] **Step 3: Commit**

```bash
git add evals.yaml
git commit -m "test: add skill evals cases"
```

---

### Task 3: Create the runner

**Files:**

- Create: `scripts/run-evals.mjs`

- [ ] **Step 1: Write the pure helpers**

In `scripts/run-evals.mjs`, write and export the pure functions:

- `parseEvals(text)` — parse YAML into `{ models, iterations, tests }`.
- `judgeContains(output, text)` — return whether `output` includes `text`.
- `buildJudgePrompt(prompt, output, skill)` — build the yes/no judge prompt.
- `formatMatrix(results)` — render the `(test, model) → passed M/N` matrix.

- [ ] **Step 2: Write the forking logic**

Add the main flow: for each model, for each test, run `iterations` times by
forking `opencode run -m <model> "<prompt>"` (via `child_process`), capture
stdout, and judge. For `type: skill`, fork a second `opencode run` with the
judge prompt and parse yes/no. For `type: contains`, use `judgeContains`.

- [ ] **Step 3: Format and verify**

Run: `yarn exec prettier --write scripts/run-evals.mjs`
Expected: no diff after a second run.

- [ ] **Step 4: Commit**

```bash
git add scripts/run-evals.mjs
git commit -m "feat: add skill evals runner"
```

---

### Task 4: Wire the `yarn evals` command

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Add the script**

Add `"evals": "node scripts/run-evals.mjs"` to the `scripts` block.

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "build: add yarn evals command"
```

---

### Task 5: Run the evals and verify

**Files:**

- None (verification only).

- [ ] **Step 1: Run the evals**

Run: `yarn evals`
Expected: a matrix prints; each `(test, model)` shows `passed M/N`.

- [ ] **Step 2: Confirm the 3/3 threshold**

Verify a `type: skill` case reports failure when any of its 3 runs fails.

- [ ] **Step 3: Run the repo checks**

Run: `yarn lint && yarn test`
Expected: all pass.

- [ ] **Step 4: Commit any remaining changes**

```bash
git add -A
git commit -m "test: verify skill evals runner"
```
