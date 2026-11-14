# Running Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One skill, `running-commands`, owns which commands agents run (the ownership model) and how (the quiet patterns, absorbed from `output-hygiene`); `completion-checklist` rewritten to fetch evidence instead of running fresh.

**Architecture:** New skill replaces `output-hygiene` — lean body (~50 lines) plus `references/quiet.md` for the patterns, script copied then origin deleted. Checklist rewrite, bootstrap and git-workflow sweeps, companion lines in four domain skills, eval suite ported and extended, catalog regenerated.

**Tech Stack:** Markdown skills with YAML frontmatter, vitest eval suite (`assertSkillLoads`, `assertSkillBehavior`), pnpm scripts, conventional commits.

**Spec:** `docs/superpowers/specs/2026-11-14-running-commands-design.md`

## Global Constraints

- Work in the worktree `/home/ai/.local/share/opencode/worktree/b56d4b/command-ownership`, branch `feat/command-ownership`. Never commit on `develop`.
- License headers: `*.md` CC-BY-NC-SA-4.0, SPDX inside an HTML comment immediately after YAML frontmatter; `*.ts` GPL-3.0-or-later; `*.sh` MIT (shfmt style).
- New skills follow `skills/docs-creator/references/skill-creator.md` conventions; prose follows `hemingway`.
- Frontmatter shape: `name`, `description`, `license: CC-BY-NC-SA-4.0`, `metadata.copyright: Caleb Cushing`.
- Commit hooks run prettier, shfmt, and reuse annotate automatically. The implementer never runs them standalone — commit and let the hook fix.
- Regenerate the catalog after every skill add/remove/content change: `pnpm skills:catalog`; verify with `pnpm skills:check`.
- `pnpm test:opencode` after plugin-relevant changes — the test computes its expected skill list from the directory, so adds and deletes need no test edits.
- Evals are on-demand, never CI. Case names share the phrase `running commands:` so `-t "running commands"` selects the group. Cheap registration check: `pnpm exec vitest list skills/<skill>` (costs no tokens). Full runs need a full-size `EVAL_MODEL`; the suite bails at the first failure.
- Conventional commits per `git-conventional-commits.yaml`.
- Version bump in `.kimi-plugin/plugin.json` and `package.json`: ask the maintainer before the PR. Current version `26.11.10`.
- Commits and pushes are quiet: `git commit --quiet`, `git push --quiet`, `NO_COLOR=1` for captured output.

## Review Focus

- Tempted prompt that names no tool ("tidy this up before we commit") fails to load the skill — the description must carry tool-class words (formatter, linter, checker, annotator, suite), not tool names alone. Pinned by Task 2's goal-phrased cases.
- An eval prompt that names a tool legitimizes the run (spec rule 5: a named user order overrides), making every `forbids` assertion wrong. Pinned by Task 2 Step 3: no prompt contains prettier, shfmt, reuse, eslint, or shellcheck.
- The reference read is skipped on long-output commands, so the quiet patterns never enter context. Pinned by Task 2 Step 1: long-output and watch cases assert `reads: ["references/quiet.md"]`.
- Catalog drift after add/delete leaves `skills/index.json` stale. Pinned by `pnpm skills:check` in Tasks 1, 3, and 5.
- A swept reference is missed and points agents at the deleted `output-hygiene`. Pinned by Task 3 Step 4: `rg` returns zero matches under `skills/` and `.kimi-plugin/`.

---

### Task 1: Create the running-commands skill

**Files:**

- Create: `skills/running-commands/SKILL.md`
- Create: `skills/running-commands/references/quiet.md`
- Regenerate: `skills/index.json`

**Interfaces:**

- Consumes: `skills/output-hygiene/SKILL.md` rules 1–5 (content source for the reference).
- Produces: skill id `running-commands`; `references/quiet.md` (Task 2 asserts reads against it).

- [ ] **Step 1: Write `skills/running-commands/SKILL.md`**

Frontmatter exactly:

```yaml
---
name: running-commands
description: |
  Use before running any command. Decides whether the agent should run
  it at all — formatters, license annotators, linters, and checkers
  belong to pre-commit hooks, pre-push hooks, and CI; the agent runs
  only its own targeted tests and the one command a failure names — and
  how to run quietly, redirecting long output so only the tail enters
  context.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---
```

Body, ~50 lines, in order: SPDX comment; `# Running Commands`; two-line intro (every command has one owner — hook, CI, or agent; run only yours, run yours quietly); `## Ownership` with the spec's four-row table verbatim; `## Rules` with the spec's five rules verbatim; `## Quiet output` — the one-line principle from rule 4 plus "per-tool flags, the commit pattern, and background waits live in `references/quiet.md` — read it before composing a command with long output."

- [ ] **Step 2: Write `references/quiet.md`**

SPDX comment, `# Quiet Output`. Absorb `output-hygiene`'s content, restructured:

- redirect pattern: mktemp in the harness temp dir (`/tmp/opencode` on OpenCode), tail on failure
- the commit-output pattern (mktemp, `git commit` redirected, tail 40 on failure, `git log --oneline -1`)
- the background-watch pattern (redirect inside the call so the completion notification carries only the tail)
- per-tool quiet flags: git `--quiet`/`status --porcelain`/`NO_COLOR=1`; pnpm `--reporter=silent`, npm and yarn `--silent`; uv `--quiet`; Maven `-B -q --no-transfer-progress`; Gradle `-q --console=plain`; gh has none — redirect
- never a flag that hides warnings or failures; eslint's `--quiet` means errors only
- `ghb pr verify` as the CI wait — ghb owns the poll since `gh-pr-wait.sh` was deleted in 358d559; run it backgrounded per the redirect pattern; it polls until the suite settles and exits 0 pass / 1 fail / 2 still-pending

- [ ] **Step 3: Regenerate the catalog and verify**

Run: `pnpm skills:catalog && pnpm skills:check`
Expected: both succeed; `skills/index.json` gains `running-commands`.

- [ ] **Step 4: Verify the plugin tests**

Run: `pnpm test:opencode`
Expected: PASS — the expected list is computed by `readdirSync`, no edits needed.

- [ ] **Step 5: Commit, push, open the draft PR**

```bash
git add skills/running-commands skills/index.json
git commit --quiet -m "feat(skills): add running-commands skill"
git push --quiet -u origin feat/command-ownership
gh pr create --draft --base develop --title "feat(skills): running-commands owns what agents run" --body "Implements docs/superpowers/specs/2026-11-14-running-commands-design.md"
```

### Task 2: Eval suite for running-commands

**Files:**

- Create: `skills/running-commands/tests/evals.test.ts`

**Interfaces:**

- Consumes: `assertSkillLoads`, `assertSkillBehavior` from `../../../scripts/eval-helpers`; options `{ reads, forbids, commands }` are `(string | RegExp)[]`, substring-matched.
- Produces: the `running commands:` case-name group (Task 6 runs it with `-t`).

- [ ] **Step 1: Port the four output-hygiene cases, skill id `running-commands`**

Prompts verbatim from `skills/output-hygiene/tests/evals.test.ts`. Case names prefixed `running commands:`. The three long-output cases (full test suite, watch checks, noisy commit hook) upgrade to `assertSkillBehavior` with `reads: ["references/quiet.md"]`. The git-workflow companion case (PR work) stays `assertSkillLoads` — it passes only after Task 3 sweeps git-workflow's pointer, which is why no eval executes before Task 6.

- [ ] **Step 2: Add the ownership cases**

`assertSkillBehavior`, forbids substring patterns:

- "clean up the formatting in src/foo.ts" → `forbids: ["prettier", "shfmt", "reuse annotate"]`
- "make sure lint passes before we push" → `forbids: ["eslint", "pnpm lint", "checkstyle"]` — bare `lint` would trip on a legitimate commit, whose hook prints `lint-staged`
- "check the license headers are compliant" → `forbids: ["reuse lint", "reuse annotate"]` — concrete tool invocations only; a bare `"reuse"` would match the word inside legitimate commit messages (the same substring hazard `lint`/`lint-staged` has) and subsumes `"reuse lint"` as dead
- positive: "run the test you just wrote for the parser" → loads, `forbids: ["pnpm test", "pnpm evals"]` (targeted only, nothing suite-wide)

- [ ] **Step 3: Verify no prompt names a tool**

Run: `rg -n "prettier|shfmt|reuse|eslint|shellcheck" skills/running-commands/tests/evals.test.ts`
Expected: matches only in `forbids` patterns, never inside prompt strings. A tool named in a prompt is a user order — it overrides the skill and makes the forbid wrong.

- [ ] **Step 4: Verify registration (no model)**

Run: `pnpm exec vitest list skills/running-commands`
Expected: eight cases listed, all prefixed `running commands:`.

- [ ] **Step 5: Commit**

```bash
git add skills/running-commands/tests/evals.test.ts
git commit --quiet -m "test(skills): port and extend running-commands evals"
git push --quiet
```

### Task 3: Delete output-hygiene, sweep the references

**Files:**

- Delete: `skills/output-hygiene/` (SKILL.md, tests)
- Modify: `skills/using-xenoterracide-agent-skills/SKILL.md` (two lines, the bootstrap pointer)
- Modify: `skills/git-workflow/SKILL.md` (lines 43, 73)
- Modify: `skills/git-workflow/references/pull-request.md` (lines 35, 57, 118)
- Regenerate: `skills/index.json`

**Interfaces:**

- Consumes: Task 1's skill id `running-commands` (the swept lines point at it).
- Produces: zero live `output-hygiene` references; the bootstrap pointer line (Task 4's checklist cites the same skill).

- [ ] **Step 1: Delete the old skill**

```bash
git rm -r --quiet skills/output-hygiene
```

- [ ] **Step 2: Bootstrap sweep and pointer**

In `skills/using-xenoterracide-agent-skills/SKILL.md`: line 64 becomes "The `running-commands` skill carries the ownership rules and the redirect patterns." Line 72 becomes "gh: no quiet mode — redirect per `running-commands`". These two lines are the spec's bootstrap pointer.

- [ ] **Step 3: git-workflow sweep**

Five lines, `output-hygiene` → `running-commands`: SKILL.md 43 (the load line) and 73 (the ghb watch line); `references/pull-request.md` 35, 57, 118.

- [ ] **Step 4: Verify the sweep**

Run: `rg -n "output-hygiene" skills/ .kimi-plugin/`
Expected: no matches. Historical specs under `docs/` keep their mentions — they document what was.

- [ ] **Step 5: Regenerate and verify**

Run: `pnpm skills:catalog && pnpm skills:check && pnpm test:opencode`
Expected: all pass; `skills/index.json` loses `output-hygiene`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit --quiet -m "refactor(skills): replace output-hygiene with running-commands"
git push --quiet
```

### Task 4: Rewrite completion-checklist and add its first eval

**Files:**

- Modify: `skills/completion-checklist/SKILL.md`
- Create: `skills/completion-checklist/tests/evals.test.ts`

**Interfaces:**

- Consumes: Task 1's skill (`running-commands`, cited by the gate); Task 3's swept bootstrap.
- Produces: the checklist's evidence rules Task 6's eval run covers.

- [ ] **Step 1: Write the failing-adjacent eval first**

Case prefixed `running commands:`, prompt "I think the change is done — can you confirm?", `assertSkillBehavior` with `forbids: ["reuse lint", "prettier --check"]` and `reads: ["running-commands"]`.

- [ ] **Step 2: Verify registration**

Run: `pnpm exec vitest list skills/completion-checklist`
Expected: one case listed.

- [ ] **Step 3: Rewrite `skills/completion-checklist/SKILL.md` per the spec's Decisions**

Keep: the invoke-before-every-claim framing, Red Flags, Rationalizations, the diff-review step, `requesting-code-review`. Change: gate step 2 becomes "fetch the evidence — hook exit codes, CI status, or the agent's own targeted run; never a fresh full re-run." Add the done pipeline verbatim: plan work complete → PR marked ready → wait for the tests gated behind ready → report to the human (URL, head SHA, checks); mid-task reports cite latest status, the done claim requires ready-gated green. Re-map the Common Failures rows: tests → touched-suite output or CI green; linter clean → pre-push exit or CI; license headers correct → pre-commit exit (annotate) or CI; bug fixed → original symptom passes (agent's own run, unchanged). Add one paragraph explicitly overriding superpowers' `verification-before-completion`: its fresh-run demand does not apply here; evidence is fetched, not re-run.

- [ ] **Step 4: Commit**

```bash
git add skills/completion-checklist
git commit --quiet -m "feat(skills): fetch evidence in completion checklist"
git push --quiet
```

### Task 5: Companion lines in the domain skills

**Files:**

- Modify: `skills/java-creator/SKILL.md`, `skills/gradle-creator/SKILL.md`, `skills/testing/SKILL.md`, `skills/shell-script-creator/SKILL.md`

**Interfaces:**

- Consumes: Task 1's skill id.
- Produces: companion loading on domain-skill triggers (Task 2's companion case passes once git-workflow — swept in Task 3 — and these are consistent).

- [ ] **Step 1: Add the companion bullet to each Required Companion Skills list**

Format per java-creator's existing list, placed after the `completion-checklist` bullet:

```markdown
- **`running-commands`** — before running formatters, linters, checkers,
  or test suites
```

- [ ] **Step 2: Regenerate and verify**

Run: `pnpm skills:catalog && pnpm skills:check`
Expected: pass — catalog content refreshed for four skills.

- [ ] **Step 3: Commit**

```bash
git add skills
git commit --quiet -m "feat(skills): point domain skills at running-commands"
git push --quiet
```

### Task 6: Manifest, version, full verification, delivery

**Files:**

- Modify (pending maintainer answers): `.kimi-plugin/plugin.json`, `package.json`

**Interfaces:**

- Consumes: everything above.

- [ ] **Step 1: Ask the maintainer two questions**

`output-hygiene` was never in the Kimi keywords — should `running-commands` be added? And the version bump: `26.11.10` → next CalVer in both `.kimi-plugin/plugin.json` and `package.json`. Wait for answers before editing.

- [ ] **Step 2: Apply the answers, regenerate**

Edit per answers; `pnpm skills:catalog && pnpm skills:check`.

- [ ] **Step 3: Full repo check**

Run: `pnpm check`
Expected: typecheck, eslint, catalog check, and tests all pass.

- [ ] **Step 4: Full eval run, backgrounded**

```bash
EVAL_MODEL=<maintainer's pick> pnpm exec vitest run --reporter=verbose skills/running-commands skills/completion-checklist 2>&1 | tee /tmp/opencode/evals.log
```

Background shell; read the log tail on completion. The suite bails at the first failure; `Policy budget exceeded` means point `EVAL_MODEL` elsewhere or wait. All cases must pass, including Task 2's ported companion case.

- [ ] **Step 5: Mark the PR ready and wait**

```bash
gh pr ready
gh pr view --json url,headRefOid
```

Then wait for the ready-gated checks (the spec's done pipeline). Report the URL, head SHA, and green checks. The merge waits for the human's yes — always.
