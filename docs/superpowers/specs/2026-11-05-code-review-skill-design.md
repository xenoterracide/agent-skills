<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Code Review Skill Design

## Intent

Fill the reviewer seat. No skill in either plugin covers it: superpowers owns
the requester seat (`requesting-code-review`) and the implementer seat
(`receiving-code-review`). Diagnosed 2026-11-05: a dispatched reviewer scanned
the catalog, found no seat, and reviewed with no skill — and never mapped the
diff's domains to `testing`, `docs-creator`, or `version-managers`
(~/.superpowers/diagnosing-superpowers/ses_e54394625ffe055314bEJgFWMa/report.md).

## Goals

1. `code-review` triggers for any request to review completed work: dispatched
   reviewer subagents and direct requests.
2. Defer to a dispatch prompt that prescribes method and format.
3. Supply a default method when nothing prescribes one.
4. Route the diff's domains to matching skills before reviewing.
5. Hemingway governs report prose, via Required Companion Skills.
6. Evals assert auto-load for both trigger shapes, and the companion load.
7. The bootstrap tells every session that messages to the partner follow
   hemingway.
8. The bootstrap stops plan-approval and execution-method prompts: pick the
   method, state it, proceed.

## Non-goals

- Not changing superpowers' `code-reviewer.md` template.
- Not the requester or implementer seat.

## Anti-goals

- Dueling prescriptions with a dispatch prompt.
- Widening hemingway's description to all output prose. It would fire every
  turn or become noise. The companion aims it.

## Approaches

- **A. Seat-aware — chosen.** Two paths: dispatched → follow the prompt, map
  domains, verify; direct → default method. The diagnosis showed the
  dispatched reviewer needed routing, not method. Direct requests lack both.
- **B. Routing-only — rejected.** No method for direct requests. Pointing at
  superpowers' template couples plugins.
- **C. Methodology-first — rejected.** Competes with prescribed prompts.

## Design

- File: `skills/code-review/SKILL.md`. License CC-BY-NC-SA-4.0, SPDX comment
  after frontmatter, per the licensing table.
- Description — the routing surface; the seat verb "reviewing" against
  superpowers' "requesting" and "receiving":

  > Use when reviewing completed work, a change, or a pull request —
  > dispatched as a reviewer subagent or asked directly — before writing the
  > review.

- Body, two paths, with a shared opening line — never spawn sub-reviewers:
  - **Dispatched with a prescribed prompt:** follow it. Before reviewing, map
    the diff's domains to the catalog and load matches: `testing`,
    `docs-creator`, `version-managers`, `java-creator`, `gradle-creator`,
    `shell-script-creator`.
  - **Direct request:** read the binding spec or plan first. Review the full
    commit range. Verify read-only: tests in a temp worktree, CI evidence.
    Calibrate severity: Critical, Important, Minor. Every finding cites
    file:line and why it matters. List declined-to-judge items, one line each
    with the reason. End with a clear verdict.
- Required Companion Skills: `hemingway` — load before writing the report. A
  prescribed format is structure; hemingway governs the prose inside it.
- Evals: `skills/code-review/tests/evals.test.ts`, using `assertSkillLoads`:
  - dispatch shape: "You are a Senior Code Reviewer… review completed work
    against its plan…"
  - direct: "review this pull request before I merge it"
  - direct: "review the diff on this branch"
  - companion: same-prompt assertion that `hemingway` loads — the pattern
    `skills/java-creator/tests/evals.test.ts` uses for `coding-standards`
- Bootstrap: `skills/using-xenoterracide-agent-skills/SKILL.md`, Writing
  Style section — state that every message to your partner follows hemingway.
  The rule's home stays `references/prose.md`; the bootstrap points to it.
  Hemingway's description is unchanged.
- Bootstrap, second edit — a `Plans and Execution` section: do not ask the
  partner to approve a plan or choose an execution method. Pick `native` for
  small plans whose tasks share no interfaces; pick `subagent-driven` when
  tasks are many or share interfaces. State the pick and why in one line.
  Merges, pushes to shared branches, publishes, and destructive or
  security-sensitive actions still stop and ask.
- Registration: `pnpm skills:catalog` writes `skills/index.json`.
  `plugin.json` points at `./skills/`; no per-skill entry. Bump
  `.kimi-plugin/plugin.json` and `package.json` so cached catalogs refresh.

## Left to the builder

- Body wording. The bullets above are required content, not final prose.
- Bootstrap Writing Style wording.
- Eval prompts: realistic, no words that trivially match the description.
- Author with `docs-creator` and `writing-skills` loaded.
