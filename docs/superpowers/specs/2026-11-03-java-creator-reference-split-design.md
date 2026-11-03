<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Java Creator Reference Split Design

## Intent

java-creator's SKILL.md carries two tool-specific topics — Immutables builders
and the Hibernate JPA metamodel — that only matter for part of its audience's
work. Move each to its own reference file so the skill body stays general Java.

## Why

- Skills share the context window. A plain Java edit pays ~45 lines of
  Immutables/Hibernate specifics it never uses.
- The repo already splits this way: version-managers keeps conventions in
  SKILL.md and recovery in references/corepack-troubleshooting.md.
- The skill review found the two topics misattributed to each other inside the
  AssertJ guidance; a reference labeled by tool ends the confusion.

## Goals

- Builders and metamodel content live in separate references, one per tool.
- SKILL.md routes to each in one line per touchpoint.
- Triggers unchanged: description and frontmatter untouched.

## Non-goals

- The JSpecify/NullAway section stays inline (heaviest section; next
  candidate, separate change).

## Approaches

1. Split Immutables only; keep the Hibernate block inline with its JPA label.
2. Labels only — no new files, no context savings.
3. Split both into one shared reference.
4. Split both into one reference per tool. (picked)

Picked 4: the two tools serve different tasks. Separate files disambiguate,
and an agent loads only the one it needs.

## Decisions

- New files: `skills/java-creator/references/immutables.md` (title
  "Immutables") and `skills/java-creator/references/hibernate.md` (title
  "Hibernate"), each with an SPDX header.
- immutables.md takes the Builders section: dependencies, `@Value.Style` +
  `@Builder.Factory`, the UserFactory example.
- hibernate.md takes the AssertJ "BEST (JPA entities)" metamodel variant and
  its explanation.
- SKILL.md keeps the `### Builders` heading with a one-line pointer to
  references/immutables.md; the AssertJ fluent example keeps BAD/GOOD/EVEN
  BETTER plus a one-line pointer to references/hibernate.md.
- Catalog: regenerate `skills/index.json` (version already bumped to 0.10.2).
- Discovered while regenerating: the generator's embedded prettier call used
  the default printWidth 80, silently diverging from the CLI's 120 —
  java-creator's three-file entry is the first to cross 80 chars. `formatIndex`
  now loads `.prettierrc.cjs` via `resolveConfig`.

## Testing harness extension

The eval harness must test behavior, not just loading:

- Export `runPrompt` so tests can inspect the raw transcript and compose
  reply-shaped assertions themselves.
- Add `detectReads(output)`: parse `→ Read <path>` lines from the transcript.
- Add `assertSkillBehavior(prompt, skill, { reads })`: per iteration, assert
  the skill loads and at least one Read matches each pattern (string
  substring or RegExp against the path).
- Unit tests for the new helpers run in the fast vitest suite — no model.

## Verification

- Harness unit tests (detectReads, assertSkillBehavior) pass via vitest.
- Two new java-creator eval cases (builder request, assertion-message request)
  run against the pre-split content as the baseline; after the split the same
  prompts must still load the skill and must read the matching reference.
- prettier, reuse, skills:check, and pnpm check after the split.

## Left to the builder

- None. All decisions are settled above.

## Future work

- A full Java compilation eval — the agent writes code, a build verifies it —
  would ground behavior testing in real output. The fixture source is
  java-commons, now Maven-based. The maintainer is considering Netflix's `ja`
  as a lighter runner but has not tried it.
