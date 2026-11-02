<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Skill Evals Design

## Intent

A persistent prompt regression suite that verifies skills auto-load and their
rules apply. It runs on demand, not in CI, and catches regressions when a
skill's `description` or body drifts.

## Goals

1. Assert skill invocation for realistic prompts, N times per case.
2. Assert a concrete consequence where a skill's rule is checkable.
3. Keep each case next to the skill it tests, so a description edit and its
   cases travel together.
4. Fail fast: the first failing case stops the suite.

## Non-goals

- Not a CI gate. Each case forks a real session, which is slow and costs
  tokens.
- Not a skill-content checker. A subagent can review skill contents inline;
  this suite tests auto-loading, which needs a full session with the skill
  tool.
- Not a judge-model harness. Detection is deterministic, so there is no second
  model call to trust.

## Constraints

- Each case forks a full session (`opencode run`), never a subagent — subagents
  lack the skill tool and cannot observe auto-loading.
- Skill invocation passes only at 3/3 runs. A flaky trigger is a failure: the
  worst outcome is having to manually invoke a skill and tell the agent to redo
  it.
- Cases never touch the developer's configuration. Each session gets a
  throwaway `XDG_CONFIG_HOME` and a temp copy of `skills/` and `.opencode/`.
- Each run has a six-minute session timeout, and the suite's test timeout scales
  with the run count. A prompt that routes into a skill-authoring workflow can
  exceed it; prefer bounded requests with the same trigger.

## Design

### Layout

- `skills/<skill>/tests/evals.test.ts` — cases for that skill.
- `skills/<skill>/tests/fixtures/` — small projects a case needs, copied into
  the session directory.
- `scripts/eval-helpers.ts` — sandbox runner and assertions.
- `scripts/eval-helpers.test.ts` — unit tests for the helpers; no model calls.
- `vitest.config.ts` — `bail: 1`, `fileParallelism: false`, 20-minute test
  timeout.

The skill catalog generator skips `tests/` directories, so cases and fixtures
never reach the published catalog.

### Detection

`opencode` writes a `Skill "name"` line to stderr when it loads a skill. The
helper strips ANSI escapes and matches that line. This is deterministic: no
judge model, no extra call, no prompt mutation.

### Sandbox

For each run the helper:

1. Creates a temp directory and copies `skills/` and `.opencode/` into it.
2. Copies the case's fixtures into the same directory when given.
3. Sets `XDG_CONFIG_HOME` to an empty temp directory and `PWD` to the session
   directory. `opencode` resolves its working directory from `PWD`, not the
   process cwd.
4. Deletes both temp directories afterwards.

Without the `XDG_CONFIG_HOME` isolation the installed plugin binds to the real
repository, and the agent edits it.

### Assertions

- `assertSkillLoads(prompt, skill, { fixture?, iterations? })` — runs the
  prompt `iterations` times (default 3) and fails if any run does not load the
  skill.
- `assertContains(prompt, text, …)` — fails if any run's transcript lacks
  `text`.

Both accept an injectable `run` function, so their failures are unit-tested
without spawning a session.

### Model and cost

`EVAL_MODEL` selects the model and defaults to a cheap one.
`EVAL_ITERATIONS` overrides the run count. A full 3/3 pass costs tokens, but
the suite is on demand only.

### Tooling

The suite is TypeScript and runs under Vitest, which bails at the first
failure. `tsc` 7 is a native binary and cannot read Yarn's PnP store, so the
repository uses the `node-modules` linker.

## Risks and Mitigations

- **Prompt drift.** Cases live next to the skill; a description change that
  breaks a case fails the suite.
- **Session timeouts.** A heavy prompt can exceed the session limit. Mitigation:
  bounded requests, and the suite bails at the first timeout instead of burning
  the remaining cases.
- **Cost.** Mitigation: on demand only, a cheap default model, and N=3.
