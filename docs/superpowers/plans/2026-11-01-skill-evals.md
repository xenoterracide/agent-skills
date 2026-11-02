<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Skill Evals Implementation Plan

> **Status:** Implemented on `feat/skill-evals`. An earlier YAML runner and
> judge-model design was replaced before merge; this plan records what shipped.

**Goal:** Add a per-skill prompt regression suite that fails when a skill stops
auto-loading.

**Architecture:** Vitest runs `skills/<skill>/tests/evals.test.ts`. Each case
calls `assertSkillLoads` from `scripts/eval-helpers.ts`, which forks
`opencode run` inside a temp copy of `skills/` and `.opencode/` with an
isolated `XDG_CONFIG_HOME`. Detection is the `Skill "name"` line on stderr.
`bail: 1` stops the suite at the first failure.

**Tech stack:** TypeScript, Vitest, `node:child_process`. No judge model.

**Spec:** `docs/superpowers/specs/2026-11-01-skill-evals-design.md`.

## Global Constraints

- Fork a full session, never a subagent — subagents lack the skill tool.
- Skill invocation passes only at 3/3 runs.
- `yarn lint`, `yarn typecheck`, and `yarn test` must pass.
- `yarn evals` is on demand and is never wired into CI.
- `skills/*/tests/` is excluded from the catalog generator.

## Review Focus

- **The runner must fork, not subagent.**
- **One failed run fails the case** — no averaging across iterations.
- **Detection must read stderr** — `execFileSync` returned only stdout, which
  hid the `Skill "..."` line.
- **Isolation must cover `XDG_CONFIG_HOME` and `PWD`** — either one missing lets
  the session mutate the real repository.
- **Prompts must be bounded** — a prompt that opens an authoring workflow
  exceeds the session timeout.

---

### Task 1: Sandbox runner

**Files:** `scripts/eval-helpers.ts`

- [x] Detect a supported harness (`opencode`, then `kimi`).
- [x] Copy `skills/` and `.opencode/` into a temp directory.
- [x] Copy fixtures into the same directory.
- [x] Set `XDG_CONFIG_HOME` and `PWD` to temp directories.
- [x] Capture `stdout` and `stderr`; strip ANSI; match `Skill "name"`.
- [x] Fail the case when any iteration misses.

### Task 2: Helper unit tests

**Files:** `scripts/eval-helpers.test.ts`

- [x] Test `stripAnsi` and `detectSkill`.
- [x] Test that `assertSkillLoads` fails on a miss and passes on a hit, using
      an injected `run`.

### Task 3: Per-skill cases and fixtures

**Files:** `skills/*/tests/evals.test.ts`, `skills/*/tests/fixtures/`

- [x] `java-creator` — natural request against a Java fixture.
- [x] `gradle-creator` — natural request against a Gradle fixture.
- [x] `hemingway` — prose trigger, Javadoc trigger, reference edit, and a
      `assertContains` rule check.
- [x] `docs-creator` — reference edit, frontmatter fix, README update.

### Task 4: Vitest configuration

**Files:** `vitest.config.ts`, `package.json`

- [x] Include `scripts/eval-helpers.test.ts` and `skills/*/tests/evals.test.ts`.
- [x] Set `bail: 1` and `fileParallelism: false`; keep sessions sequential.
- [x] Set a 20-minute test timeout above the six-minute session timeout.
- [x] Wire `yarn evals`.

### Task 5: Catalog exclusion

**Files:** `scripts/generate-skill-catalog.mjs`

- [x] Skip `tests/` directories when listing skill files.
- [x] Cover the exclusion with a unit test.

### Task 6: TypeScript and linker

**Files:** `tsconfig.json`, `.yarnrc.yml`, `package.json`

- [x] Migrate helpers and cases to TypeScript.
- [x] Typecheck with `tsc`.
- [x] Switch to the `node-modules` linker so `tsc` 7 can resolve types.
- [x] Migrate to pnpm; its isolated `node_modules` keeps strict resolution.

### Task 8: Skill content fixes found by the evals

**Files:** `skills/coding-standards/SKILL.md`, `skills/docs-creator/references/`

- [x] Widen the `coding-standards` description to scripts, tests, and build
      files.
- [x] Rewrite Rule 4 to cover tools, not just code.
- [x] Drop the stale `kimi -p` testing path and require a full session for
      trigger tests.

### Task 9: Verify

- [x] `yarn typecheck`, `yarn test`, `yarn lint` pass.
- [ ] A full `yarn evals` run passes 3/3 on every case.
