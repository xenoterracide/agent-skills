<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Code Review Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the reviewer-seat `code-review` skill; make hemingway govern agent messages via the bootstrap.

**Architecture:** One seat-aware skill, two paths: dispatched reviewers follow the prescribed prompt and route the diff's domains to matching skills; direct requests get a default method. Hemingway is a required companion for report prose. The bootstrap's Writing Style section extends the same rule to every message. Version 26.11.2 refreshes the catalog.

**Tech Stack:** OpenCode skills (Markdown SKILL.md, YAML frontmatter), vitest eval suite (`assertSkillLoads`), pnpm, prettier, REUSE.

**Spec:** `docs/superpowers/specs/2026-11-05-code-review-skill-design.md`

## Global Constraints

- `skills/code-review/SKILL.md`: CC-BY-NC-SA-4.0, SPDX HTML comment immediately after frontmatter.
- `skills/code-review/tests/evals.test.ts`: GPL-3.0-or-later SPDX header.
- Version `26.11.2` in `.kimi-plugin/plugin.json` and `package.json`.
- `pnpm skills:catalog` regenerates `skills/index.json`; `pnpm skills:check` stays clean.
- Evals pass at 3/3 runs; prompts stay bounded (six-minute sessions); full-size model — if the provider quota dies, set `EVAL_MODEL`. Evals run on demand only.
- Commit types from `git-conventional-commits.yaml`. Pre-commit runs lint-staged.

## Review Focus

- Requester-seat prompt ("I'm done — request a review of my work") must not load `code-review`. No negative-load helper exists; pinned by description wording — Task 1, step 7.
- Implementer-seat prompt ("address this review feedback") must not load `code-review`. Same pin.
- A dispatch prompt that prescribes format must be followed, not re-prescribed. Pinned by body wording — Task 1, step 3. No eval asserts deference.
- A direct request with no repo context must still load the skill, not stall. Pinned by Task 1, cases 2-3 running without fixture or repo.
- The bootstrap edit must not break its existing triggers. Pinned by Task 2, step 3.

---

### Task 1: `code-review` skill

**Files:**

- Create: `skills/code-review/SKILL.md`
- Create: `skills/code-review/tests/evals.test.ts`
- Modify: `.kimi-plugin/plugin.json` (version)
- Modify: `package.json` (version)
- Modify: `skills/index.json` (generated)

**Interfaces:**

- Consumes: nothing.
- Produces: skill id `code-review`; description verbatim from the spec's Design section; Required Companion Skills: `hemingway`.

- [ ] **Step 1: Write the failing evals**

`skills/code-review/tests/evals.test.ts`, GPL-3.0-or-later header, `assertSkillLoads` imported from `../../../scripts/eval-helpers`:

1. Dispatch shape: `assertSkillLoads("You are a Senior Code Reviewer. Review the completed work against its plan before it merges.", "code-review")`
2. Direct: `assertSkillLoads("review this pull request before I merge it", "code-review")`
3. Direct: `assertSkillLoads("review the diff on this branch", "code-review")`
4. Companion, the same-prompt pattern as `skills/java-creator/tests/evals.test.ts:16-20`: `assertSkillLoads("review this diff before I merge it:\n--- a/app.sh\n+++ b/app.sh\n@@ -1 +1 @@\n-echo $1\n+echo \"$1\"", "hemingway")` — the finding is prose, so hemingway loads for the report.

- [ ] **Step 2: RED**

Run: `EVAL_ITERATIONS=1 pnpm evals skills/code-review`
Expected: FAIL — `skill "code-review" did not load`; case 4 fails on `hemingway`.

- [ ] **Step 3: Write `skills/code-review/SKILL.md`**

Frontmatter: `name: code-review`; the description verbatim from the spec's Design section; `license: CC-BY-NC-SA-4.0`; `metadata.copyright: Caleb Cushing`. SPDX HTML comment immediately after. Body: the two paths, the domain list, never spawn sub-reviewers — all per the spec's Design bullets. Required Companion Skills section naming `hemingway`, loaded before writing the report.

- [ ] **Step 4: Bump versions**

`.kimi-plugin/plugin.json` and `package.json`: `26.11.1` → `26.11.2`.

- [ ] **Step 5: Regenerate the catalog**

Run: `pnpm skills:catalog`
Expected: `skills/index.json` gains `code-review` at version `26.11.2`.

- [ ] **Step 6: GREEN**

Run: `pnpm evals skills/code-review`
Expected: PASS, 3/3 runs every case.

- [ ] **Step 7: Seat-wording check (Review Focus 1-2)**

Run: `grep -n 'requesting\|receiving\|reviewing' skills/code-review/SKILL.md`
Expected: the description uses only the reviewing seat's verb.

- [ ] **Step 8: Repo checks**

Run: `pnpm test && pnpm skills:check`
Expected: pass. "registers every bundled skill" compares against the directory; the new skill needs no test change.

- [ ] **Step 9: Commit**

```bash
git add skills/code-review .kimi-plugin/plugin.json package.json skills/index.json
git commit -m "feat: add code-review skill"
```

### Task 2: bootstrap Writing Style

**Files:**

- Modify: `skills/using-xenoterracide-agent-skills/SKILL.md` (Writing Style section)

**Interfaces:** none.

- [ ] **Step 1: Extend the Writing Style rule to messages**

Replace:

```markdown
See the `hemingway` skill for prose and code rules.
```

with wording covering both, e.g.:

```markdown
Every message you send your partner, and every file you write, follows the
`hemingway` skill. Short. Concrete. No filler. Prose rules live in
`references/prose.md`; code rules in `references/code.md`.
```

- [ ] **Step 2: Catalog sync**

Run: `pnpm skills:check`
Expected: pass. If it fails: `pnpm skills:catalog`.

- [ ] **Step 3: Bootstrap evals still pass**

Run: `pnpm evals skills/using-xenoterracide-agent-skills`
Expected: PASS 3/3 — triggers unchanged.

- [ ] **Step 4: Commit**

```bash
git add skills/using-xenoterracide-agent-skills/SKILL.md
git commit -m "docs: apply hemingway to agent messages"
```
