<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Autonomous Delivery and Inline Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reviews of a PR post inline comments to it, and agents deliver work by committing as they go into a draft PR that flips ready on green draft checks.

**Architecture:** Skill prose only. `code-review` gains the posting rule and points at `github` for API mechanics. The bootstrap gains the delivery rule, `git-workflow` gains the commands, and `commit-creator` stops asking for a why.

**Tech Stack:** Markdown skills, `gh` CLI, vitest evals, the skill catalog script.

**Spec:** `docs/superpowers/specs/2026-11-12-pr-inline-review-design.md` and `docs/superpowers/specs/2026-11-12-autonomous-delivery-design.md`

## Global Constraints

- Skill files carry the SPDX comment after the frontmatter. No REUSE header change.
- Prose follows `hemingway`: short sentences, active voice, no filler.
- One fact, one home. `github` owns API mechanics; `code-review` points at it.
- Never approve. Never merge without the human's yes.
- Evals run on demand, never in CI.

## Review Focus

- Every finding is off-diff: the review must still post, with the findings in the body.
- One bad anchor 422s the review: repost without it, losing no finding.
- A second review at the same head SHA: no duplicate path and line.
- A repo with no expensive gate: the ready flip still happens; the two check sets are one.
- Draft checks failing: no ready flip, report the failure instead.

---

### Task 1: Post reviews inline

**Files:**

- Modify: `skills/code-review/SKILL.md`
- Modify: `skills/github/SKILL.md`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces: the section names `Post the Review to the PR` and `Create a PR Review with Inline Comments`, which Task 3's eval names nothing of.

- [ ] **Step 1: Add `github` to `code-review`'s Required Companion Skills**

Append one bullet: load `github` before posting, for the review API mechanics.

- [ ] **Step 2: Add `Post the Review to the PR` to `code-review`**

Place it after `Direct Request`. Required content from the spec: PR only; one
review; severity, wrong, why; `REQUEST_CHANGES` on Critical or Important, else
`COMMENT`, never `APPROVE`; `Not on the diff` body fallback; skip posted path
and line; reply with verdict, counts, URL.

- [ ] **Step 3: Add `Create a PR Review with Inline Comments` to `github`**

Required content: head SHA command; `POST repos/{owner}/{repo}/pulls/<n>/reviews`
with `--input -`; JSON fields `commit_id`, `event`, `body`, `comments[]`;
`path`, `line`, `side` (`RIGHT` for added or unchanged, `LEFT` for deletions),
`start_line`; 422 repost rule; MCP pending-review route.

- [ ] **Step 4: Verify the texts**

Run:
`grep -c "REQUEST_CHANGES" skills/code-review/SKILL.md skills/github/SKILL.md`

Expected: one or more matches in each file.

- [ ] **Step 5: Commit**

```bash
git add skills/code-review/SKILL.md skills/github/SKILL.md \
  docs/superpowers/specs/2026-11-12-pr-inline-review-design.md
git commit -m "feat(code-review): post reviews inline to the PR"
```

### Task 2: Deliver work without asking

**Files:**

- Modify: `skills/using-xenoterracide-agent-skills/SKILL.md`
- Modify: `skills/git-workflow/references/pull-request.md`
- Modify: `skills/git-workflow/references/commit-creator.md`

**Interfaces:**

- Consumes: nothing.
- Produces: the `--draft` default and the `gh pr ready` step that Task 3's eval asserts.

- [ ] **Step 1: Extend `Plans and Execution` in the bootstrap**

Required content: commit and push each completed step; open a draft PR on the
first push, without asking; on green draft checks run `gh pr ready`; watch what
ready releases; report URL and head SHA; merge still waits.

- [ ] **Step 2: Add the draft rules to `pull-request.md`**

Shared rules gain commit-and-push per step and draft PR on the first push. Step
4 creates with `--draft`. Add `Draft, Ready, and Checks` with the two check
sets, `gh pr ready <n>`, and the post-ready fix rule.

- [ ] **Step 3: Drop the why question in `commit-creator.md`**

Add the design doc or plan path to the why sources. Replace "ask the user for
one line, or omit" with omit.

- [ ] **Step 4: Verify the texts**

Run: `grep -n -- "--draft\|pr ready\|do not ask" skills/git-workflow/references/pull-request.md skills/using-xenoterracide-agent-skills/SKILL.md`

Expected: `--draft` in `pull-request.md`, `pr ready` in both, no prompt to ask.

- [ ] **Step 5: Commit**

```bash
git add skills/using-xenoterracide-agent-skills/SKILL.md \
  skills/git-workflow/references/pull-request.md \
  skills/git-workflow/references/commit-creator.md \
  docs/superpowers/specs/2026-11-12-autonomous-delivery-design.md
git commit -m "feat(git-workflow): deliver through a draft PR"
```

### Task 3: Assert both behaviors in evals

**Files:**

- Modify: `skills/code-review/tests/evals.test.ts`
- Modify: `skills/git-workflow/tests/evals.test.ts`

**Interfaces:**

- Consumes: the skill text from Tasks 1 and 2.
- Produces: nothing later tasks use.

- [ ] **Step 1: Assert the `github` companion in `code-review`**

Same PR prompt as the hemingway companion case, `assertSkillLoads(prompt, "github")`, one iteration-labelled case.

- [ ] **Step 2: Assert `--draft` in `git-workflow`**

Add `commands: [/gh pr create[^\n]*--draft/]` to the existing heredoc case. If the model omits `--draft`, the test fails, which is the point.

- [ ] **Step 3: Typecheck the tests**

Run: `pnpm typecheck`

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add skills/code-review/tests/evals.test.ts skills/git-workflow/tests/evals.test.ts
git commit -m "test(skills): assert inline review and draft PR"
```

### Task 4: Catalog, checks, and the draft PR

**Files:**

- Modify: `skills/index.json`
- Modify: `.kimi-plugin/plugin.json` and `package.json` when the human approves a bump.

- [ ] **Step 1: Regenerate the catalog**

Run: `pnpm skills:catalog`

Expected: `wrote skills/index.json`.

- [ ] **Step 2: Run the checks**

Run: `pnpm check`

Expected: exit 0.

- [ ] **Step 3: Commit and push**

```bash
git add -A
git commit -m "chore(skills): refresh the catalog"
git push -u origin feat/pr-inline-review
```

- [ ] **Step 4: Open the draft PR**

```bash
gh pr create --draft --title "feat(skills): post reviews inline and deliver through draft PRs" --body-file - <<'EOF'
- Post PR reviews as inline comments, with REQUEST_CHANGES when fixes are needed
- Open draft PRs without asking, flip ready on green draft checks, then settle the full set
- Stop asking for a commit why; omit it when no source grounds it
EOF
```

- [ ] **Step 5: Settle draft checks, flip ready, settle the rest**

Run: `gh pr checks <PR> --watch`, redirected per `output-hygiene`. On green,
`gh pr ready <PR>`, then watch again. Report the URL and head SHA. Do not merge.
