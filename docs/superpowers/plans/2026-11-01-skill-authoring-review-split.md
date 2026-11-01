<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Skill Authoring/Review Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split skill authoring from skill review into two reference files, and extract the shared "Hemingway rule" style standard into its own file so neither duplicates it.

**Architecture:** `docs-creator` already routes to `references/*.md` files. This change splits the current `skill-creator.md` (which mixes authoring and review) into `skill-creator.md` (authoring) and `skill-reviewer.md` (review), and adds `hemingway-rule.md` (shared style) plus `skill-reviewer-template.md` (reviewer subagent prompt). No new skills are added; only reference files under the existing `docs-creator` skill change.

**Tech Stack:** Markdown, Prettier, REUSE (`yarn lint:reuse`), `yarn skills:check`.

**Spec:** `docs/superpowers/specs/` — this change has no separate spec file; the design was agreed inline in the session (split authoring/review, share the Hemingway rule, add a request-review workflow with a reviewer template).

## Global Constraints

- Reference files carry an SPDX HTML comment header and a `# Title`, with no YAML frontmatter or `description` (per `skill-creator.md` "File Structure").
- License for `*.md` is CC-BY-NC-SA-4.0; copyright `Copyright © 2026 Caleb Cushing`.
- Format with `yarn exec prettier --write <file>`; no changes must remain.
- `yarn lint:reuse` must pass.
- No new skills are added, but the catalog version is bumped (0.5.0 → 0.6.0) and `skills/index.json` regenerated so OpenCode refreshes its cached copy of `docs-creator`; `yarn skills:check` must still pass.
- The Superpowers `writing-skills` skill is referenced but not modified (it lives outside this repo).

## Review Focus

- **A reference file with no frontmatter** must not be mistaken for a skill — keep the SPDX header + title shape, no `---` block.
- **The routing table in `docs-creator/SKILL.md`** must list every new reference, or the agent won't find it.
- **Moved sections must not be duplicated** — after the split, `skill-creator.md` must not still contain the review checklists.
- **The Hemingway rule must be referenced from both** `skill-creator.md` and `skill-reviewer.md`, not pasted into either.
- **The reviewer template placeholders** must be unambiguous so a dispatcher can fill them without guessing.

---

### Task 1: Create the Hemingway rule reference

**Files:**

- Create: `skills/docs-creator/references/hemingway-rule.md`

**Interfaces:**

- Produces: a style standard file referenced by `skill-creator.md` (Task 4) and `skill-reviewer.md` (Task 3).

- [ ] **Step 1: Write the file**

Create `skills/docs-creator/references/hemingway-rule.md` with the SPDX header, a `# Hemingway Rule` title, and the following body (already approved in session):

- Intro line: "Write skills the way Hemingway wrote prose. Short. Concrete. Every word earns its place."
- `## The rules` — seven numbered rules:
  1. **Short sentences.** One idea per sentence. Split anything joined by "and", "but", or a semicolon.
  2. **Concrete words.** Prefer short, plain words. "Use", not "utilize". "Run", not "execute".
  3. **Active voice.** Tell the agent what to do. "Run the test." Not "The test should be run."
  4. **Cut qualifiers.** No "very", "really", "just", "simply", "basically". No hedging: "might", "perhaps", "generally".
  5. **Cut filler.** No "please", "note that", "it is important to", "in order to", "you should".
  6. **Cut what doesn't earn its place.** If the sentence works without a word, cut the word. If the skill works without a sentence, cut the sentence.
  7. **Concrete over abstract.** Show the specific command, file, or example. Don't describe it in general terms.
- `## Why` — "Skills share the context window with everything else. Terse skills cost less, trigger more reliably, and leave less room for the agent to rationalize around vague instructions."
- `## Before / after` — a blockquote pair:
  - Before: "It is important to note that you should generally run the test suite in order to verify that your changes have not introduced any regressions."
  - After: "Run the tests. Verify no regressions."

- [ ] **Step 2: Format and verify**

Run: `yarn exec prettier --write skills/docs-creator/references/hemingway-rule.md`
Expected: no diff after a second run.

- [ ] **Step 3: Commit**

```bash
git add skills/docs-creator/references/hemingway-rule.md
git commit -m "docs: add hemingway-rule style standard for skills"
```

---

### Task 2: Create the skill reviewer template

**Files:**

- Create: `skills/docs-creator/references/skill-reviewer-template.md`

**Interfaces:**

- Produces: a reviewer subagent prompt template referenced by `skill-reviewer.md` (Task 3).

- [ ] **Step 1: Write the file**

Create `skills/docs-creator/references/skill-reviewer-template.md` with the SPDX header and `# Skill Reviewer Template` title. Model it on the Superpowers `code-reviewer.md` template, but for skills. It must contain:

- A fenced prompt block for a `general-purpose` subagent with `description: "Review skill changes"`.
- Placeholders: `[SKILL_PATH]` (path to the skill under review), `[DESCRIPTION]` (what the skill is meant to do), `[CHANGES]` (what changed and why).
- A "What to Check" section listing the four review dimensions:
  - **Hemingway rule** — check the skill against `references/hemingway-rule.md` (short sentences, concrete words, active voice, no qualifiers/filler, concrete over abstract).
  - **Validation** — frontmatter valid (`---` first line, `name` + `description` present), copyright correct, formatting passes.
  - **Discoverability** — description triggers on real requests, wording matches `AGENTS.md`, boundaries with nearby skills explained.
  - **Behavior** — RED baseline and GREEN test were run; the skill counters the rationalizations the agent used.
- A "Read-Only Review" note (do not mutate the working tree).
- A "You Do Not Dispatch Subagents" note.
- An "Output Format" section: Strengths, Issues (Critical / Important / Minor), Assessment ("Ready to merge? Yes | No | With fixes").
- A "Placeholders" list after the block explaining each placeholder.

- [ ] **Step 2: Format and verify**

Run: `yarn exec prettier --write skills/docs-creator/references/skill-reviewer-template.md`
Expected: no diff after a second run.

- [ ] **Step 3: Commit**

```bash
git add skills/docs-creator/references/skill-reviewer-template.md
git commit -m "docs: add skill reviewer subagent template"
```

---

### Task 3: Create the skill reviewer reference

**Files:**

- Create: `skills/docs-creator/references/skill-reviewer.md`

**Interfaces:**

- Consumes: `hemingway-rule.md` (Task 1), `skill-reviewer-template.md` (Task 2).
- Produces: the review reference routed from `docs-creator/SKILL.md` (Task 5).

- [ ] **Step 1: Write the file**

Create `skills/docs-creator/references/skill-reviewer.md` with the SPDX header and `# Skill Reviewer` title. It contains:

- An intro line: review a skill before it ships; check style, validation, discoverability, and behavior.
- A line pointing to `hemingway-rule.md` as the style standard to check against.
- **Testing Skills** — move verbatim from `skill-creator.md` lines 196-267 (Mechanical Discovery Tests, Behavioral Compliance Tests, Limits of `kimi -p` Testing).
- **Validation Checklist** — move verbatim from `skill-creator.md` lines 293-309.
- **Discoverability Checklist** — move verbatim from `skill-creator.md` lines 311-320.
- **Requesting Review** — a new section: dispatch a `general-purpose` reviewer subagent using `skill-reviewer-template.md`, fill the placeholders, act on feedback by severity (fix Critical immediately, Important before proceeding, note Minor), and push back with reasoning when the reviewer is wrong.

- [ ] **Step 2: Format and verify**

Run: `yarn exec prettier --write skills/docs-creator/references/skill-reviewer.md`
Expected: no diff after a second run.

- [ ] **Step 3: Commit**

```bash
git add skills/docs-creator/references/skill-reviewer.md
git commit -m "docs: add skill-reviewer reference with review workflow"
```

---

### Task 4: Trim skill-creator.md to authoring only

**Files:**

- Modify: `skills/docs-creator/references/skill-creator.md`

**Interfaces:**

- Consumes: `hemingway-rule.md` (Task 1).
- Produces: an authoring-only reference; the review content now lives in `skill-reviewer.md` (Task 3).

- [ ] **Step 1: Remove the review sections**

Delete from `skill-creator.md`:

- The "Testing Skills" section (lines 196-267).
- The "Validation Checklist" section (lines 293-309).
- The "Discoverability Checklist" section (lines 311-320).

Keep: intro + REQUIRED SUB-SKILL, Source of Truth, File Structure, Naming Conventions, SKILL.md Format, Copyright and Licensing, Code Style, Best Practices.

- [ ] **Step 2: Point Best Practices at the Hemingway rule**

In the "Best Practices" section, update item 2 ("Keep it concise") to reference `hemingway-rule.md` as the style standard, and add a line near the top of the file (after the intro) pointing to `hemingway-rule.md` for style.

- [ ] **Step 3: Format and verify**

Run: `yarn exec prettier --write skills/docs-creator/references/skill-creator.md`
Expected: no diff after a second run.

- [ ] **Step 4: Commit**

```bash
git add skills/docs-creator/references/skill-creator.md
git commit -m "docs: trim skill-creator to authoring, route style to hemingway-rule"
```

---

### Task 5: Update docs-creator routing

**Files:**

- Modify: `skills/docs-creator/SKILL.md`

**Interfaces:**

- Consumes: `skill-reviewer.md` (Task 3), `hemingway-rule.md` (Task 1).

- [ ] **Step 1: Extend the routing table**

In `skills/docs-creator/SKILL.md`, extend the routing table to:

| Writing or revising         | Read                                 |
| --------------------------- | ------------------------------------ |
| `README.md`                 | `references/readme-creator.md`       |
| `AGENTS.md`                 | `references/agents-creator.md`       |
| `CONTRIBUTING.md`           | `references/contributing-creator.md` |
| A reusable skill `SKILL.md` | `references/skill-creator.md`        |
| Reviewing a skill           | `references/skill-reviewer.md`       |
| Skill style standard        | `references/hemingway-rule.md`       |

- [ ] **Step 2: Format and verify**

Run: `yarn exec prettier --write skills/docs-creator/SKILL.md`
Expected: no diff after a second run.

- [ ] **Step 3: Commit**

```bash
git add skills/docs-creator/SKILL.md
git commit -m "docs: route skill review and hemingway rule in docs-creator"
```

---

### Task 6: Bump version and regenerate catalog

**Files:**

- Modify: `.kimi-plugin/plugin.json`
- Modify: `package.json`
- Modify: `skills/index.json` (regenerated)

**Interfaces:**

- Produces: a bumped catalog version so OpenCode refreshes its cached copy of `docs-creator`.

- [ ] **Step 1: Bump the version**

In `.kimi-plugin/plugin.json` and `package.json`, change `"version": "0.5.0"` to `"version": "0.6.0"`.

- [ ] **Step 2: Regenerate the catalog**

Run: `yarn skills:catalog`
Expected: `skills/index.json` is regenerated; `yarn skills:check` passes afterward.

- [ ] **Step 3: Commit**

```bash
git add .kimi-plugin/plugin.json package.json skills/index.json
git commit -m "chore: bump version to 0.6.0"
```

---

### Task 7: Behavioral test of the skill evaluation

**Files:**

- None (test artifacts live in the workspace `.superpowers/sdd/2026-11-01-skill-authoring-review-split/`).

**Interfaces:**

- Consumes: `hemingway-rule.md` (Task 1), `skill-reviewer-template.md` (Task 2), `skill-reviewer.md` (Task 3).

- [ ] **Step 1: Write a deliberately verbose sample skill**

Create `sample-verbose-skill.md` in the workspace. It must violate the Hemingway rule (long compound sentences, qualifiers like "very"/"simply", filler like "it is important to note that", passive voice) and carry a validation defect (frontmatter missing `description`, or `---` not the first line).

- [ ] **Step 2: Test the rule's effect**

Apply the Hemingway rule to the sample by hand. Produce a terse rewrite. Verify it is shorter and clearer: fewer words, one idea per sentence, active voice, no qualifiers or filler.

- [ ] **Step 3: RED baseline**

Dispatch a `general` subagent to review the sample skill WITHOUT any reference to `skill-reviewer.md` or `hemingway-rule.md`. Record what it misses (does it flag the verbose style? the frontmatter defect?).

- [ ] **Step 4: GREEN test**

Dispatch a `general` subagent using `skill-reviewer-template.md` to review the same sample. Verify it flags the Hemingway violations and the validation defect, and returns severity-graded output (Critical / Important / Minor) with an assessment.

- [ ] **Step 5: Record findings**

Append the RED and GREEN results to the ledger, noting the rationalizations the RED reviewer used and whether the GREEN reviewer caught them.

---

### Task 8: Full verification

**Files:**

- None (verification only).

- [ ] **Step 1: Run the lint and catalog checks**

Run: `yarn lint:reuse && yarn skills:check`
Expected: both pass with no errors.

- [ ] **Step 2: Confirm no review content remains in skill-creator.md**

Run: `grep -n "Validation Checklist\|Discoverability Checklist\|Testing Skills" skills/docs-creator/references/skill-creator.md`
Expected: no matches.

- [ ] **Step 3: Confirm the Hemingway rule is referenced, not duplicated**

Run: `grep -rn "hemingway-rule" skills/docs-creator/`
Expected: references in `SKILL.md`, `skill-creator.md`, and `skill-reviewer.md`; the rule body appears only in `hemingway-rule.md`.

- [ ] **Step 4: Commit any remaining changes**

```bash
git add -A
git commit -m "docs: verify skill authoring/review split"
```
