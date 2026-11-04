<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Hooks Healing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One `heal.sh` owns toolchain healing; git hooks, `.envrc`, and `contribute` call it, in agent-skills, github, and java-commons.

**Architecture:** `heal.sh` lives in `.config/git/hooks/`, byte-identical in all three repos. Hooks keep diff checks as a fast-path, then invoke the full healer. A `flock` serializes concurrent heals. agent-skills also moves `.share/git/hooks` to `.config/git/hooks` first.

**Tech Stack:** POSIX sh, flock, asdf, corepack, pnpm, uv; Node `node:test` for the healer's tests.

**Spec:** `docs/superpowers/specs/2026-11-04-hooks-healing-design.md` — the executor reads both. The spec's Decisions section defines `heal.sh` step order, gating, lock behavior, and exit semantics; this plan does not restate them.

## Global Constraints

- `#!/bin/sh`, dash-compatible; shfmt-formatted (2-space indent); shellcheck clean, no disables.
- `heal.sh` is byte-identical across the three repos. Ports copy it from the agent-skills branch and prove it with `diff`; never retype.
- `HEAL_LOCK_WAIT` env var (seconds, default 300) is the only test knob — a spec addendum, flagged at handoff.
- Lock file: `$(git rev-parse --git-dir)/heal.lock`. Store the git dir in a lowercase var; never `GIT_DIR`, which collides with git's env.
- Renovate files, CI workflows, `.kimi-plugin/plugin.json`, and `package.json` version untouched.
- agent-skills runs on branch `heal-toolchain` from `origin/develop`; port repos use the same branch name. Create it before Task 1 (worktree optional, per superpowers:using-git-worktrees).
- Conventional commit messages per `git-conventional-commits.yaml`; squash-merge PRs; the human merges, never the agent.
- Every task commits through the hooks — after Task 1, `core.hooksPath` points at `.config/git/hooks`, so lint-staged runs on each commit.

## Review Focus

- heal.sh run from a subdirectory — must resolve the repo root from its own path; markers still gate. Test: Task 2, "runs from a subdirectory".
- heal.sh loses its exec bit — hooks and `.envrc` exec it directly; a 644 file breaks them silently. Test: Task 2 verification asserts mode `100755`.
- `flock` missing (macOS) — heal still runs, unlocked. Test: Task 2, "heals without flock".
- A step fails (network down, pnpm errors) — later steps still run, script exits 0. Test: Task 2, "a failed step does not stop the rest".
- Hook fires inside a git worktree — `dirname "$0"` and `--git-dir` resolve per worktree; the lock does not collide with the main checkout. Test: Task 6 step 2, worktree run.

---

### Task 1: Move agent-skills hooks to `.config/git/hooks`

**Files:**

- Rename: `.share/git/hooks/{pre-commit,commit-msg,post-checkout,post-merge}` → `.config/git/hooks/`
- Modify: `package.json:31`, `AGENTS.md:104`, `CONTRIBUTING.md:21`, `.envrc:18`, `.lintstagedrc.cjs:36`, `.prettierignore:6`

**Interfaces:**

- Consumes: nothing.
- Produces: hooks at `.config/git/hooks/`; every reference updated. Tasks 2-4 build here.

- [ ] **Step 1: Move the four hooks**

`.share` holds nothing but `git/hooks`. Run:

```bash
mkdir -p .config/git
git mv .share/git/hooks/pre-commit .share/git/hooks/commit-msg \
  .share/git/hooks/post-checkout .share/git/hooks/post-merge .config/git/hooks/
rmdir .share/git/hooks .share/git .share
```

- [ ] **Step 2: Update the six references**

- `package.json:31` — `git config core.hooksPath .config/git/hooks`
- `AGENTS.md:104` — hooks section: path becomes `.config/git/hooks`
- `CONTRIBUTING.md:21` — same path swap
- `.envrc:18` — same path swap
- `.lintstagedrc.cjs:36` — glob becomes `{.config/git/hooks/**,**/*.*sh,.envrc}` (commands unchanged)
- `.prettierignore` — drop the `.share/` line; hooks are now prettier-checked, matching github

- [ ] **Step 3: Repoint the local config**

Run: `git config core.hooksPath .config/git/hooks`
Why: local config still names `.share`; without this, no hook runs on this commit.

- [ ] **Step 4: Verify**

Run: `pnpm lint`
Expected: PASS. The hooks were prettier-ignored under `.share`; if prettier flags formatting, apply `pnpm exec prettier --write` to the hooks and rerun.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: move git hooks to .config/git/hooks"
```

### Task 2: `heal.sh` with tests

**Files:**

- Create: `.config/git/hooks/heal.sh` (mode 100755)
- Test: `scripts/heal.test.mjs` (picked up by `node --test scripts/*.test.mjs`)

**Interfaces:**

- Consumes: Task 1's hooks directory.
- Produces: `.config/git/hooks/heal.sh` — executable, POSIX sh; always exits 0; `HEAL_LOCK_WAIT` env (default 300); step order and gating per the spec's Decisions; always ends with `git config core.hooksPath .config/git/hooks`. Tasks 3, 4, 7, 8 exec this path.

- [ ] **Step 1: Write the failing test**

Test harness, fixed by this plan — fake bins record each invocation to a log; `heal.sh` runs against a temp dir:

```js
// fake bin: shims record argv, one file per tool
const makeShim = (bin, tool, argv = []) =>
  write(`${bin}/${tool}`, `#!/bin/sh\necho "$@" >> "$SHIM_LOG/${tool}"\nexit ${argv.exit ?? 0}\n`);
```

Run `heal.sh` with `spawnSync`, `cwd` = temp repo, `env.PATH` = `${fakeBin}:${realPath}`, `SHIM_LOG` = temp log dir. Cases:

- `no markers` — only `git` called (`config core.hooksPath .config/git/hooks`), exit 0
- `asdf install` logged when `.tool-versions` exists; when asdf is absent from PATH, a warning prints, exit 0
- corepack on PATH — `npm` never called; `corepack enable --install-directory ~/.local/bin` logged
- corepack absent — `npm install --global corepack` and `asdf reshim nodejs` logged
- `pnpm-lock.yaml` gates `pnpm install --frozen-lockfile`; `uv.lock` gates `uv sync --frozen`
- `CI=1` — nothing runs, exit 0
- `a failed step does not stop the rest` — pnpm shim exits 1; uv and git still log, exit 0
- `lock held` — background `flock <lockfile> sleep 5`, `HEAL_LOCK_WAIT=0` — skip message, exit 0, no shims
- `heals without flock` — PATH lacks flock — shims still log
- `runs from a subdirectory` — cwd = temp repo `docs/` — markers still gate

The fake `git` must answer `rev-parse --git-dir` (print a temp path) and log `config`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/heal.test.mjs`
Expected: FAIL — heal.sh does not exist.

- [ ] **Step 3: Implement `heal.sh`**

Skeleton, in order: shebang and SPDX MIT header; `cd` to the repo root computed from the script's own path (`../../..` from `.config/git/hooks`); CI guard; lock block (flock when present, `HEAL_LOCK_WAIT`, skip-and-exit-0 on timeout, run unlocked when absent); the spec's five steps, each gated on its marker, each warn-and-continue; `exit 0`. The corepack bootstrap sequence is verbatim in the spec's Decisions.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/heal.test.mjs`
Expected: PASS, all cases.

- [ ] **Step 5: Lint and mode**

Run: `shfmt --write .config/git/hooks/heal.sh && shellcheck .config/git/hooks/heal.sh && chmod 755 .config/git/hooks/heal.sh`
Then `git add` and `git ls-files -s .config/git/hooks/heal.sh` — expected `100755`.

- [ ] **Step 6: Verify repo checks**

Run: `pnpm check`
Expected: PASS — the new test file joins the suite.

- [ ] **Step 7: Commit**

```bash
git add .config/git/hooks/heal.sh scripts/heal.test.mjs
git commit -m "feat: add heal.sh toolchain healer"
```

### Task 3: Rewire post-checkout and post-merge

**Files:**

- Modify: `.config/git/hooks/post-checkout`, `.config/git/hooks/post-merge`

**Interfaces:**

- Consumes: `heal.sh` (Task 2) — exec as `"$(dirname "$0")/heal.sh"`.
- Produces: hooks that heal when `.tool-versions`, `pnpm-lock.yaml`, or `uv.lock` changed.

- [ ] **Step 1: Extend both hooks**

Add a `TOOL_VERSIONS_CHANGED` check beside the lockfile checks (same `git diff --quiet` pattern, `-- .tool-versions`). When any of the three changed: `echo` what changed, then exec `"$(dirname "$0")/heal.sh"`. Full heal, never scoped. Keep the CI and branch-checkout guards.

- [ ] **Step 2: Verify the hook fires**

Temp clone of this branch. The clone has no `core.hooksPath` — set it first: `git config core.hooksPath .config/git/hooks`. Fake-bin PATH as in Task 2, but only the tools (asdf, pnpm, uv, npm, corepack) — git stays real, the hook's own `git diff` needs it, and heal's `git config` may run for real. Create a branch bumping `.tool-versions`, commit, `git checkout` it.
Expected: the hook prints its change notice and the shims log `asdf install` and the rest.

- [ ] **Step 3: Commit**

```bash
git add .config/git/hooks/post-checkout .config/git/hooks/post-merge
git commit -m "feat: heal toolchain from checkout and merge hooks"
```

### Task 4: Collapse `.envrc` and `contribute`

**Files:**

- Modify: `.envrc`, `package.json`

**Interfaces:**

- Consumes: `heal.sh` (Task 2).
- Produces: `.envrc` = SPDX header + `./.config/git/hooks/heal.sh`; `"contribute": "sh .config/git/hooks/heal.sh"`.

- [ ] **Step 1: Rewrite `.envrc`**

Keep the SPDX header; the only working line is `./.config/git/hooks/heal.sh`.

- [ ] **Step 2: Collapse package.json scripts**

`contribute` becomes `sh .config/git/hooks/heal.sh`. Delete `setup:corepack` and `setup:pnpm`.

- [ ] **Step 3: Verify**

Run: `sh .envrc` then `pnpm contribute`
Expected: both run the healer and exit 0. Then `pnpm check` — PASS. `grep -rn "setup:\|precontribute"` — no stale references outside docs (Task 5 handles prose).

- [ ] **Step 4: Commit**

```bash
git add .envrc package.json
git commit -m "chore: route envrc and contribute through heal.sh"
```

### Task 5: Update the docs

**Files:**

- Modify: `AGENTS.md`, `CONTRIBUTING.md`

**Interfaces:**

- Consumes: everything Tasks 1-4 produced.
- Produces: prose matching reality. Use the docs-creator skill for placement.

- [ ] **Step 1: Update AGENTS.md**

Git Hooks section: new path, `heal.sh` and what it heals, the lock, the `HEAL_LOCK_WAIT` knob. Dependency Sync section: point at the healer. Source of Truth table: add a row for toolchain healing → `.config/git/hooks/heal.sh`.

- [ ] **Step 2: Update CONTRIBUTING.md**

Getting Started: direnv entry or `sh .config/git/hooks/heal.sh`; what `pnpm contribute` now does.

- [ ] **Step 3: Verify and commit**

Run: `pnpm lint` — PASS.

```bash
git add AGENTS.md CONTRIBUTING.md
git commit -m "docs: describe the toolchain healer"
```

### Task 6: Whole-branch verification and PR

**Files:** none new.

**Interfaces:**

- Consumes: the finished branch.
- Produces: an open PR; the heal.sh source of truth for Tasks 7-8.

- [ ] **Step 1: Full checks**

Run: `pnpm lint && pnpm check`
Expected: PASS.

- [ ] **Step 2: Functional checks from the spec**

- `sh .config/git/hooks/heal.sh` in this repo — no-op fast, exit 0.
- Lock skip: `flock .git/heal.lock sleep 5 &` then `HEAL_LOCK_WAIT=2 sh .config/git/hooks/heal.sh` — skip message, exit 0.
- Worktree: `git worktree add --detach /tmp/opencode/heal-wt`, run heal inside — exit 0; lock lands in the worktree's git dir, not `.git/`. (Detached: the branch is checked out in the main tree.)

- [ ] **Step 3: Push and open the PR**

Per the git-workflow skill: push `heal-toolchain`, open the PR against `develop`, conventional title, plain bullets, sibling-PR note (github and java-commons ports follow). Show URL, head SHA, and green checks. Never merge — the human decides.

### Task 7: Port to xenoterracide/github

**Files** (all in a clone at `/tmp/opencode/github`, branch `heal-toolchain` from `origin/develop`):

- Create: `.config/git/hooks/heal.sh` — copied byte-identical from the agent-skills `heal-toolchain` branch
- Modify: `.config/git/hooks/post-checkout`, `.config/git/hooks/post-merge`, `.envrc`, `package.json`, doc prose where `precontribute`, `setup:`, or `contribute` appears

**Interfaces:**

- Consumes: `heal.sh` from Task 6's branch — source path `/home/ai/agent-skills/.config/git/hooks/heal.sh` (the agent-skills repo on `heal-toolchain`).
- Produces: a github PR mirroring agent-skills.

- [ ] **Step 1: Set up the clone and copy heal.sh**

`gh repo clone xenoterracide/github /tmp/opencode/github`, checkout `develop`, pull, branch `heal-toolchain`. Copy `heal.sh` from the source path above; `diff` the two — expected empty; mode 755. Run it once — it sets `core.hooksPath`, so the coming commit runs through the hooks.

- [ ] **Step 2: Rewire hooks and .envrc**

Apply Task 3's hook edits. github's `.envrc` currently holds only `asdf install`; rewrite it per Task 4 — header plus the one-line heal call.

- [ ] **Step 3: Collapse package.json scripts**

`contribute` → `sh .config/git/hooks/heal.sh`; delete `precontribute`, `setup:corepack`, `setup:pnpm`.

- [ ] **Step 4: Update prose**

`grep -rn "precontribute\|setup:corepack\|setup:pnpm"` across `README.md`, `AGENTS.md`, `CONTRIBUTING.md` where present; update to the healer story, docs-creator rules.

- [ ] **Step 5: Verify and commit**

Run: `pnpm lint`, `shfmt --check` and `shellcheck` on the scripts if installed (CI runs them regardless), the Task 2 Step 1 functional tests, and the Task 3 Step 2 checkout test — all against this clone.
Expected: PASS. Commit — type `feat`, message mirroring agent-skills; the commit runs through the now-active hooks.

- [ ] **Step 6: Push and open the PR**

Per git-workflow. Note the agent-skills PR as the source of truth for `heal.sh`.

### Task 8: Port to xenoterracide/java-commons

**Files** (clone at `/tmp/opencode/java-commons`, branch `heal-toolchain`):

- Create: `.config/git/hooks/heal.sh` — byte-identical copy
- Modify: `.config/git/hooks/post-checkout`, `.config/git/hooks/post-merge`, `.envrc`, `package.json`, doc prose where the old scripts appear

**Interfaces:**

- Consumes: `heal.sh` from Task 6's branch — source path `/home/ai/agent-skills/.config/git/hooks/heal.sh`.
- Produces: a java-commons PR mirroring agent-skills.

- [ ] **Step 1: Set up the clone and copy heal.sh**

As Task 7, repo `xenoterracide/java-commons`, clone at `/tmp/opencode/java-commons`. Copy and `diff` `heal.sh`, mode 755, run it once to set `core.hooksPath`.

- [ ] **Step 2: Rewire hooks and .envrc**

Apply Task 3's hook edits. java-commons' `.envrc` currently holds the full healing sequence — all of it collapses into Task 4's one-line call.

- [ ] **Step 3: Collapse package.json scripts**

As Task 7.

- [ ] **Step 4: Update prose**

As Task 7; also check its `AGENTS.md` for `.envrc` or contribute descriptions.

- [ ] **Step 5: Verify and commit**

As Task 7 Step 5 — `pnpm lint`, shfmt/shellcheck, the Task 2 Step 1 functional tests, and the Task 3 Step 2 checkout test against this clone.

- [ ] **Step 6: Push and open the PR**

As Task 7.
