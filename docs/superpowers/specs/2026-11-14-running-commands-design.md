<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Running Commands Design

## Intent

Agents run commands whose results they don't need: formatters the
pre-commit hook runs anyway, checkers pre-push and CI will run, whole
suites a touched-suite run answers. They parse floods of output that
re-sends every turn. Three causes:

1. `completion-checklist` demands "run that command fresh, completely"
   and its evidence table names `reuse lint` and linter output.
2. Aggregate scripts (`pnpm lint`, `pnpm check`) look official. Agents
   run what looks official.
3. No skill states which commands the agent owns, or how to run its
   own quietly.

Fix: every command gets one owner — pre-commit hook, pre-push hook,
CI, or the agent. One skill, `running-commands`, owns the whole act of
running commands: whether to run (the ownership model) and how (the
quiet patterns, absorbed from `output-hygiene`).

## Goals

1. The agent never runs a formatter, license annotator, or checker
   standalone — not pre-flight, not "to be safe", not to claim done.
2. The agent's standing commands: targeted tests in the dev loop (the
   test being written, the suite touched), and the one command a hook
   or CI failure names, on the file it names.
3. Completion evidence comes from hook exit codes and CI status, not
   local re-runs.
4. `running-commands` owns the model and the quiet patterns;
   `completion-checklist` cites it; the bootstrap carries one pointer
   line.
5. Evals prove loading for both trigger classes — tempted commands
   and long output — and assert the reference read.

## Non-goals

- No eslint-class checks in pre-commit. Too slow in Java. Hooks stay
  fast, per-file.
- No agent-gated hooks. Pre-push runs for everyone; humans have
  `git push --no-verify`.
- No pnpm orchestration inside hooks. Hooks call tools directly.
- No CI redesign. CI calls tools directly, `github`-repo style.

## Anti-goals

- No aggregate local check command. Existence is bait: agents read
  `package.json` and AGENTS.md and run what looks official. No
  `pnpm lint`, no `pnpm check`. The ecosystem's own test task
  (`pnpm test`, `gradle test`, `mvn test`) is the only aggregate that
  stays.
- No agent discipline replacing enforcement. Anything a hook can
  enforce, the agent stops running.

## Constraints

Substrate ships from base-template via copier — a separate spec in
the base-template repo, not this spec:

- Pre-commit keeps lint-staged: fixers only — `prettier --write`,
  `shfmt --write`, `uv run reuse annotate`. Verified current state:
  `.lintstagedrc.cjs` runs exactly these; shellcheck is a checker, not
  a fixer, so it moves to pre-push. (AGENTS.md's pre-commit bullet
  still names shellcheck — stale; fixed when the docs shrink.)
- A pre-push hook, same shape: tool-direct checkers on pushed files,
  shellcheck among them. Unconditional; `git push --no-verify` is the
  human escape hatch.
- CI workflows call tools directly.
- No `lint`/`check` scripts in `package.json`.
- `ghb pr verify` reports CI results. It blocks until checks settle,
  so it runs as a background wait per the quiet patterns. (`ghb` ships
  `pr sync` and `pr verify` today; if a `pr check` subcommand lands
  later, the skill renames.)

## Approaches

Where the rules live:

| Approach                             | Rules live in                                  | Trade                                   |
| ------------------------------------ | ---------------------------------------------- | --------------------------------------- |
| A: new skill; checklist cites it     | fires at command time, where the waste happens | two loads to prove by evals             |
| B: rewrite completion-checklist only | already distributed by four companion skills   | fires at claim time — too late mid-loop |
| C: table in the bootstrap            | every session sees it                          | every session pays the tokens; bloats   |

Picked A, plus one pointer line in the bootstrap.

Skill shape:

| Approach                           | Shape                                 | Trade                                         |
| ---------------------------------- | ------------------------------------- | --------------------------------------------- |
| Merge into `running-commands`      | one skill, one near-universal trigger | union bytes per load; port and sweep bill     |
| Two skills: model + output-hygiene | targeted loads, no port               | same moment loads twice; two names, two homes |
| Rename `output-hygiene` only       | smallest bill                         | no ownership model; the waste survives        |

Picked the merge. Both skills fire "about to run a command" — the
model decides whether, hygiene decides how. One trigger — before
running any command — is the most reliable load possible, and a
missed load is the exact waste this spec kills.

Body content:

| Approach                     | Body carries                     | Trade                                       |
| ---------------------------- | -------------------------------- | ------------------------------------------- |
| Split: lean body + reference | table, rules, one-line principle | a read call on run-moments                  |
| All in body                  | everything, always injected      | don't-run loads pay patterns they never use |
| All in references            | pointers only                    | the decision itself costs a read            |

Picked the split, on the java-creator criterion: content some loads
never use goes to references. The load that pays is the one whose
answer is "don't run it" — trigger right, decision needs the table,
quiet patterns dead weight. This spec's product is multiplying exactly
those loads. Run-moments read the reference once; those bytes sit in
context like body bytes would — a wash. The read is enforced by evals:
`assertSkillBehavior({ reads })`.

## The model

| Owner      | Commands                                    | Runs when | Evidence        |
| ---------- | ------------------------------------------- | --------- | --------------- |
| Pre-commit | prettier --write, shfmt, reuse annotate     | commit    | hook exit code  |
| Pre-push   | per-file checkers: shellcheck, eslint-class | push      | hook exit code  |
| CI         | full-repo checkers, typecheck, full suites  | push      | `ghb pr verify` |
| Agent      | targeted tests; the command a failure names | dev loop  | command output  |

Agent rules:

1. Never run another row's commands standalone. Not before pushing,
   not before claiming done.
2. Run targeted tests: the test being written, the suite touched — a
   vitest path, `gradle --tests`, `mvn -Dtest`. Not the full suite.
3. On hook or CI failure: run the tool on the named file — the
   checker to see it, the fixer to fix it — then retry the git
   command. This is the one standalone path for a fixer: lint-staged
   missed what the check caught.
4. Run what's yours quietly: redirect long output to a mktemp file in
   the harness temp dir, tail on failure. Full patterns — per-tool
   flags, commit output, background waits — live in
   `references/quiet.md`; read it before composing a command with
   long output.
5. The rules bind the agent's initiative, not the user's word. A
   named command from the user overrides — run it once, say the hook
   would have. Goal phrasing ("clean up the formatting") is not an
   order; route it through the owner: commit, and the hook formats.

## Skill structure

- `skills/running-commands/SKILL.md`, ~50 lines: frontmatter
  description covering both trigger classes — tempted commands
  (formatters, linters, checkers, suites) and long output — the
  ownership table, the five rules, the one-line quiet principle,
  pointers to the reference.
- `skills/running-commands/references/quiet.md`, absorbed from
  `output-hygiene`: the redirect patterns, the commit-output pattern,
  background waits, the per-tool quiet-flag table, `ghb pr verify` as
  the CI wait — the poll `gh-pr-wait.sh` once served, deleted in
  358d559 when ghb became its single implementation.
- `skills/output-hygiene/` is deleted after its eval cases port.
- The bootstrap keeps its compact quiet-flag table — one-time per
  session, serves sessions that never load the skill. The reference
  is the authority; the bootstrap is the summary.

## Decisions

- Skill name: `running-commands`. Agents say "run X" — the name
  matches the prompts, and a glancing human reads it. Rejected:
  `command-ownership` — jargon, matches nothing an agent says, no
  glance value; `who-runs-what`, `trust-the-hooks`,
  `dont-duplicate-ci` — readable, but each undersells half the model.
- Absorb `output-hygiene`. Same moment, the model's own rules pair
  (run your targeted tests, run them quiet), one near-universal
  trigger, one home for every pointer. The maintainer never liked the
  name. Costs accepted: union bytes on run-moment loads, the eval
  port, the reference sweep.
- Post-push early-warning runs rejected: local full checks kicked off
  after push, background, tail on failure. CI stays the sole runner
  of full suites — duplication and wake traffic buy minutes at best.
- `completion-checklist` gate: step 2 becomes "fetch the evidence" —
  hook exit codes, CI status, or the agent's own targeted run. Done is
  a pipeline, not a moment: plan work complete → PR marked ready →
  wait for the tests gated behind ready → report to the human (URL,
  head SHA, checks). Mid-task status reports cite the latest fetched
  status; the done claim requires the ready-gated checks green. The
  Common Failures rows re-map: tests → touched-suite output or CI
  green; linter clean → pre-push exit or CI; license headers →
  pre-commit exit (annotate) or CI; bug fixed → original symptom
  passes (agent's own run, unchanged).
- Keep `completion-checklist`, rewritten. Removal was considered and
  rejected: superpowers ships `verification-before-completion`, which
  demands fresh runs of linters, builds, and tests before every
  claim, commit, and push — the exact behavior this spec kills, in a
  plugin we don't control. Delete the in-house checklist and the
  claim-time moment falls back to it. The rewrite must explicitly
  override the sibling: evidence is hook exit codes, CI status, and
  targeted runs, not fresh full re-runs. Removal's blast radius —
  four companion lists, the bootstrap, `docs-creator`'s skill-creator
  guidance, the Kimi manifest, the catalog — buys nothing.
- Domain skills that tempt agents into checkers — `java-creator`,
  `gradle-creator`, `testing`, `shell-script-creator` — list
  `running-commands` as a companion alongside `completion-checklist`.
- `git-workflow`'s five `output-hygiene` mentions — two lines in
  SKILL.md (the load line, the ghb watch line), three in
  `references/pull-request.md` — become `running-commands`.
- Sequencing: base-template ships pre-push first — its spec is being
  written now, separate agent. This skill lands after or alongside.
  No interim exception: until a repo has pre-push, the agent lints
  nothing and CI catches it. This repo's substrate adoption — delete
  `lint`/`check` scripts, convert CI to tool-direct, shrink
  AGENTS.md/README "Build and Test" — lands with the same rollout.

## Left to the builder

- Write `skills/running-commands/SKILL.md` per Skill structure.
- Write `references/quiet.md` absorbing `output-hygiene`'s rules,
  with `ghb pr verify` as the CI wait. Delete
  `skills/output-hygiene/`.
- Port `output-hygiene`'s four eval cases to `running-commands` —
  prompts unchanged, including the git-workflow companion case; the
  long-output prompts also assert `reads: references/quiet.md`.
- New eval cases for ownership temptations — goal or initiative
  phrasing, never a named order ("clean up the formatting in
  src/foo.ts", "make sure lint passes before we push", "check the
  license headers") — load the skill and forbid the tool commands via
  `assertSkillBehavior`. A named order overrides, so naming the tool
  in the prompt would legitimize the run. One positive case: run the
  test just written, nothing wider.
- First eval for `skills/completion-checklist`: a "confirm this is
  done" prompt loads it; no fresh `reuse lint` or checker runs.
  Expressed with existing machinery only — load, `forbids`, `reads`
  (`running-commands`). No new claim-text assertion helper, no
  sandbox hook installation, without the maintainer's sanction.
- Rewrite `skills/completion-checklist/SKILL.md` per Decisions.
- Bootstrap: add the pointer line; its two `output-hygiene` mentions
  become `running-commands`.
- `git-workflow` reference sweep (five mentions).
- Companion lines in the four domain skills.
- Kimi manifest: `output-hygiene` was never listed; ask the
  maintainer whether `running-commands` earns a slot.
- Regenerate the catalog (`pnpm skills:catalog`); ask about a version
  bump before the PR.
