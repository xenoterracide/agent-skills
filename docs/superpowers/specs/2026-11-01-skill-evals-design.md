<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Skill Evals Design

## Intent

A persistent prompt regression suite that verifies skills auto-load and their
rules apply, runnable across models to catch regressions when a skill's
`description` or body drifts.

## Goals

1. Record RED-GREEN test cases (prompt → expected behavior) in a versioned file.
2. Run each case against multiple models, N times each, because LLMs are
   non-deterministic.
3. Verify skill invocation as the priority, rule application as a supplement.
4. Report a pass/fail matrix per run.

## Non-goals

- Not a CI gate. The runner forks sessions and calls a judge model, so it is
  slow and costs tokens; it runs on demand, not on every commit.
- Not a skill-content checker. A subagent can review skill contents inline;
  this suite tests auto-loading, which needs a full session with the skill
  tool.

## Constraints

- The runner must fork a full session (`opencode run` / `kimi -p`), not a
  subagent — subagents lack the skill tool and cannot observe auto-loading.
- Skill invocation must pass 3/3 runs. A flaky trigger is a failure: the worst
  outcome is having to manually invoke a skill and tell the agent to redo it.
- Results are ephemeral and are not committed; the test cases and model list
  are.

## Approaches Considered

### Pass/fail signal

- **LLM judge** (chosen, primary) — a second model call reads the session
  output and answers "did the expected skill get invoked and followed?".
  Flexible, handles the fuzzy "did it actually load" question; costs a model
  call and is itself non-deterministic.
- **Structured output** — each prompt ends with "report which skill you used as
  JSON". Reliable and cheap, but artificial: it modifies the prompt to make it
  testable.
- **Behavioral check** (chosen, supplement) — assert on a concrete consequence
  of the skill loading (e.g. `var foo = "foo"`). Concrete and automatable, but
  tests "rule applied" rather than "skill loaded".

### Format

- **YAML** (chosen) — block scalars handle multi-line prompts and expectations;
  comments explain each case; the repo already uses YAML.

## Design

### `evals.yaml`

```yaml
models:
  - opencode/deepseek-v4-pro
  - anthropic/claude-sonnet-4-5

iterations: 3

tests:
  - name: java-creator triggers on a natural request
    prompt: modify the App class so the greeting is uppercase
    expect:
      type: skill
      name: java-creator
  - name: java-creator var rule
    prompt: |
      refactor this java code to conform with style:
      String foo = "foo"
    expect:
      type: contains
      text: 'var foo = "foo"'
```

- `expect.type: skill` — the LLM judge checks that the named skill was invoked
  and followed.
- `expect.type: contains` — the output must contain the text.

### Runner

`scripts/run-evals.mjs`, invoked as `yarn evals`. For each `(test, model)`, it
forks a fresh session N times, judges each output, and reports a matrix of
`(test, model) → passed M/N`.

## Risks and Mitigations

- **`opencode run` flags are unverified.** Mitigation: confirm the exact
  invocation (skills directory, model selection) before writing the runner.
- **Judge non-determinism.** Mitigation: the 3/3 threshold on the _judged_
  result, and the judge is asked a yes/no question to reduce variance.
- **Cost.** Mitigation: on-demand invocation, not CI; a small default model
  list.

## Left to the Builder

- The exact `opencode run` invocation and how the judge model is called.
- The judge prompt wording.
- Whether `iterations` and the threshold are per-suite or per-test.
- The results output format (table, JSON, or both).
