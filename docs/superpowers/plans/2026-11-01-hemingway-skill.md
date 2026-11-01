<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Hemingway Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the Hemingway rule from a `docs-creator` reference into its own `hemingway` skill with two facets (prose and code), wire it as a companion to the writing and code skills, and add a one-line principle to the always-loaded bootstrap.

**Architecture:** A new `hemingway` skill holds the terse-and-concrete principle. `references/prose.md` generalizes the existing seven prose rules from "skills" to "all prose"; `references/code.md` adds the seven code rules. `docs-creator`, `coding-standards`, and `java-creator` list `hemingway` as a companion skill. `using-xenoterracide-agent-skills` carries a two-line principle pointing at it. The old `docs-creator/references/hemingway-rule.md` is removed.

**Tech Stack:** Markdown, Prettier, REUSE (`yarn lint:reuse`), `yarn skills:check`.

**Spec:** none — the design was agreed inline in the session (promote to a skill, two facets, companion wiring, bootstrap principle).

## Global Constraints

- Skill files carry YAML frontmatter (`name`, `description`) first, then an SPDX HTML comment. Reference files carry an SPDX header + `# Title`, no frontmatter.
- License for `*.md` is CC-BY-NC-SA-4.0; copyright `Copyright © 2026 Caleb Cushing`.
- Format with `yarn exec prettier --write <file>`; no changes must remain.
- `yarn lint:reuse` and `yarn skills:check` must pass.
- A new skill is added, so the catalog version is bumped (0.6.0 → 0.7.0) and `skills/index.json` regenerated.
- The `hemingway` skill name is a noun (matches the repo's noun-over-gerund convention); it is not a language/tech skill, so no `-creator` suffix.

## Review Focus

- **The old `hemingway-rule.md` must be fully removed** — no dangling references to it remain in `docs-creator`.
- **Every reference to the old rule must point at the `hemingway` skill** — `skill-creator.md`, `skill-reviewer.md`, and `skill-reviewer-template.md` all referenced it.
- **The prose facet must generalize, not just rename** — "skills" becomes "prose" so it covers docs, comments, Javadoc, and AsciiDoc.
- **The code facet must not absorb `coding-standards`** — it is only the terse-and-concrete lens, layered on top of SOLID/immutability/error-handling.
- **The bootstrap principle must stay short** — two lines, not the full rules, to avoid always-loaded context bloat.

---

### Task 1: Create the hemingway skill

**Files:**

- Create: `skills/hemingway/SKILL.md`
- Create: `skills/hemingway/references/prose.md`
- Create: `skills/hemingway/references/code.md`

**Interfaces:**

- Produces: the `hemingway` skill referenced by `docs-creator` (Task 2), `coding-standards` and `java-creator` (Task 3), and `using-xenoterracide-agent-skills` (Task 4).

- [ ] **Step 1: Write `SKILL.md`**

Frontmatter `name: hemingway`, `description` covering prose and code terseness, `license: CC-BY-NC-SA-4.0`, `metadata.copyright: Caleb Cushing`. Body: a one-line principle ("Write the way Hemingway wrote. Short. Concrete. Every word and line earns its place.") and a routing table:

| Writing                                           | Read                  |
| ------------------------------------------------- | --------------------- |
| Prose (skills, docs, comments, Javadoc, AsciiDoc) | `references/prose.md` |
| Code (structure, naming)                          | `references/code.md`  |

- [ ] **Step 2: Write `references/prose.md`**

The seven prose rules, generalized from "skills" to "prose": short sentences, concrete words, active voice, cut qualifiers, cut filler, cut what doesn't earn its place, concrete over abstract. Keep the "Why" and "Before / after" sections, with "skills" replaced by "prose" and "the agent" replaced by "the reader".

- [ ] **Step 3: Write `references/code.md`**

The seven code rules: short methods, concrete names, imperative names, name the role not the relationship (with `UserFactory` as good and `AbstractEntityBase` as bad, plus the collision caveat), no boilerplate, YAGNI, concrete types. Add a short "Why".

- [ ] **Step 4: Format and verify**

Run: `yarn exec prettier --write skills/hemingway/SKILL.md skills/hemingway/references/prose.md skills/hemingway/references/code.md`
Expected: no diff after a second run.

- [ ] **Step 5: Commit**

```bash
git add skills/hemingway/
git commit -m "feat: add hemingway skill with prose and code facets"
```

---

### Task 2: Rewire docs-creator

**Files:**

- Delete: `skills/docs-creator/references/hemingway-rule.md`
- Modify: `skills/docs-creator/SKILL.md`
- Modify: `skills/docs-creator/references/skill-creator.md`
- Modify: `skills/docs-creator/references/skill-reviewer.md`
- Modify: `skills/docs-creator/references/skill-reviewer-template.md`

**Interfaces:**

- Consumes: the `hemingway` skill (Task 1).

- [ ] **Step 1: Delete the old rule**

Run: `git rm skills/docs-creator/references/hemingway-rule.md`

- [ ] **Step 2: Update `SKILL.md`**

Remove the "Skill style standard | `references/hemingway-rule.md`" row from the routing table. Add a "Required Companion Skills" section listing `hemingway` (for prose style).

- [ ] **Step 3: Update `skill-creator.md`**

Change "Write the skill's prose against `hemingway-rule.md`" to "Write the skill's prose against the `hemingway` skill", and "follow `hemingway-rule.md`" to "follow the `hemingway` skill".

- [ ] **Step 4: Update `skill-reviewer.md`**

Change "Check style against `hemingway-rule.md`" to "Check style against the `hemingway` skill".

- [ ] **Step 5: Update `skill-reviewer-template.md`**

In the "Read the standards" block, replace the `hemingway-rule.md` line with a line pointing at the `hemingway` skill (prose and code facets).

- [ ] **Step 6: Format and verify**

Run: `yarn exec prettier --write` on the four modified files.
Expected: no diff after a second run.

- [ ] **Step 7: Commit**

```bash
git add skills/docs-creator/
git commit -m "docs: route docs-creator prose style to the hemingway skill"
```

---

### Task 3: Add hemingway as a companion to code skills

**Files:**

- Modify: `skills/coding-standards/SKILL.md`
- Modify: `skills/java-creator/SKILL.md`

**Interfaces:**

- Consumes: the `hemingway` skill (Task 1).

- [ ] **Step 1: Update `coding-standards`**

Add a "Required Companion Skills" section (or extend the existing intro) listing `hemingway` for terse, concrete code style.

- [ ] **Step 2: Update `java-creator`**

In the existing "Required Companion Skills" section, add `hemingway` for Javadoc and code style.

- [ ] **Step 3: Format and verify**

Run: `yarn exec prettier --write` on both files.
Expected: no diff after a second run.

- [ ] **Step 4: Commit**

```bash
git add skills/coding-standards/SKILL.md skills/java-creator/SKILL.md
git commit -m "docs: add hemingway as a companion to code skills"
```

---

### Task 4: Add the principle to the bootstrap

**Files:**

- Modify: `skills/using-xenoterracide-agent-skills/SKILL.md`

**Interfaces:**

- Consumes: the `hemingway` skill (Task 1).

- [ ] **Step 1: Add a two-line principle**

Add a short section (e.g. under "Key Principle") stating: "Write tersely and concretely. Every word and line earns its place. See the `hemingway` skill for the rules." Keep it to two lines.

- [ ] **Step 2: Format and verify**

Run: `yarn exec prettier --write skills/using-xenoterracide-agent-skills/SKILL.md`
Expected: no diff after a second run.

- [ ] **Step 3: Commit**

```bash
git add skills/using-xenoterracide-agent-skills/SKILL.md
git commit -m "docs: add hemingway principle to the session bootstrap"
```

---

### Task 5: Update AGENTS.md routing

**Files:**

- Modify: `AGENTS.md`

- [ ] **Step 1: Add a routing row**

Add a `hemingway` row to the "Skill Routing" table: activate when writing prose or code that should be terse and clear.

- [ ] **Step 2: Format and verify**

Run: `yarn exec prettier --write AGENTS.md`
Expected: no diff after a second run.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: route hemingway in AGENTS.md"
```

---

### Task 6: Bump version and regenerate catalog

**Files:**

- Modify: `.kimi-plugin/plugin.json`
- Modify: `package.json`
- Modify: `skills/index.json` (regenerated)

- [ ] **Step 1: Bump the version**

Change `"version": "0.6.0"` to `"version": "0.7.0"` in both files.

- [ ] **Step 2: Regenerate the catalog**

Run: `yarn skills:catalog`
Expected: `skills/index.json` lists 14 skills including `hemingway`; `yarn skills:check` passes.

- [ ] **Step 3: Commit**

```bash
git add .kimi-plugin/plugin.json package.json skills/index.json
git commit -m "chore: bump version to 0.7.0"
```

---

### Task 7: Full verification

**Files:**

- None (verification only).

- [ ] **Step 1: Run lint and catalog checks**

Run: `yarn lint:reuse && yarn skills:check && yarn lint:prettier`
Expected: all pass.

- [ ] **Step 2: Confirm no dangling references to the old rule**

Run: `grep -rn "hemingway-rule" skills/ AGENTS.md`
Expected: no matches.

- [ ] **Step 3: Confirm the hemingway skill is referenced, not duplicated**

Run: `grep -rln "hemingway" skills/ AGENTS.md`
Expected: the `hemingway` skill files, plus references in `docs-creator`, `coding-standards`, `java-creator`, `using-xenoterracide-agent-skills`, and `AGENTS.md`.

- [ ] **Step 4: Run the test suite**

Run: `yarn test`
Expected: all pass.

- [ ] **Step 5: Commit any remaining changes**

```bash
git add -A
git commit -m "docs: verify hemingway skill wiring"
```
