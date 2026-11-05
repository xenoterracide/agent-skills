<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Hooks Healing Design

## Intent

Git hooks heal the full toolchain, not just lockfiles. One script —
`.config/git/hooks/heal.sh` — owns the healing. Hooks, `.envrc`, and
`contribute` all call it. The same file ships in agent-skills, github, and
java-commons.

## Why

- post-checkout and post-merge sync `pnpm-lock.yaml` and `uv.lock` only. A
  Renovate asdf bump lands and the local toolchain stays missing.
  Non-direnv contributors hit broken shims until they run `asdf install`
  by hand.
- Healing logic lives in three places per repo: `.envrc`, `contribute`,
  hooks. They drift. github's `.envrc` is `asdf install` only; its
  `contribute` skips asdf.
- Two shells can heal at once — a checkout hook in one, direnv in the
  other. `asdf install` and `npm install --global corepack` take no lock;
  concurrent runs can corrupt installs.

## Goals

- `heal.sh` in `.config/git/hooks/`, byte-identical in all three repos.
- Hooks diff `.tool-versions` too and call `heal.sh` when anything
  relevant changed.
- `.envrc` becomes one line: run `heal.sh`.
- `contribute` runs `heal.sh`; `precontribute`, `setup:corepack`, and
  `setup:pnpm` die.
- agent-skills moves `.share/git/hooks` to `.config/git/hooks` — the
  pattern java-commons already adopted.
- Concurrent heals serialize via `flock`.

## Non-goals

- Renovate: all three `renovate.json5` files are byte-identical. No
  change.
- CI workflows: unchanged; CI installs its own toolchain via actions.
- Maven dependency healing: no lockfile exists. `mvnw` downloads on
  demand.
- A shared package or template repo: copy-paste per repo at this scale.

## Approaches

1. One full-scope `heal.sh`; callers gate only whether to invoke it.
2. Scoped healer (`heal.sh asdf`, `heal.sh pnpm`). A lock-skipped run
   loses its scope; every caller keeps its own diff logic.
3. Hooks source `.envrc` directly. Same idea, wrong path and name.

Picked 1: full-scope runs converge. Every heal ends complete, no-op
steps cost about a second, and marker files make one script fit every
repo's stack.

## Decisions

- `heal.sh` is POSIX sh with an MIT SPDX header, formatted by shfmt and
  clean under shellcheck. The lint-staged glob
  `{.config/git/hooks/**,**/*.*sh,.envrc}` covers it.
- Steps run in order, each gated on its marker file. A failed step warns
  and the rest still run. The script exits 0 so direnv and hooks never
  go red from a heal failure.
  - `.tool-versions` → `asdf install`; warn and continue when asdf is
    absent.
  - `package.json` → corepack bootstrap from the current `.envrc`:
    `corepack --version || { npm install --global corepack; asdf reshim
nodejs; }`, then `corepack enable --install-directory ~/.local/bin`.
  - `pnpm-lock.yaml` → `pnpm install --frozen-lockfile`.
  - `uv.lock` → `uv sync --frozen`.
  - Always → `git config core.hooksPath .config/git/hooks`.
- Lock: `flock -w 300` on `$(git rev-parse --git-dir)/heal.lock`. On
  timeout, print a skip notice and exit 0 — the next event heals. When
  `flock` is missing, run unlocked.
- `[ -n "$CI" ] && exit 0` at the top; the hooks keep their own guard.
- Hooks add `.tool-versions` to the diff set and invoke
  `"$(dirname "$0")/heal.sh"` when any marker changed. Full run, never
  scoped.
- `.envrc` keeps its SPDX header and runs `./.config/git/hooks/heal.sh`.
  No `watch_file` on lockfiles or `.tool-versions` — direnv would
  double-fire on every checkout that changes them.
- `package.json` scripts: `"contribute": "sh .config/git/hooks/heal.sh"`.
  Fresh-machine entry is direnv or `sh .config/git/hooks/heal.sh` — no
  pnpm needed to start.
- agent-skills also: `git mv .share/git/hooks .config/git/hooks`; update
  `package.json`, `AGENTS.md`, `CONTRIBUTING.md`; point the lint-staged
  glob at `.config/git/hooks`; drop `.share/` from `.prettierignore`.
- Three PRs, one per repo, each carrying the same `heal.sh`. This design
  doc commits to agent-skills only. No plugin version bump: tooling, not
  skill or plugin behavior.

## Verification

- Every repo: `pnpm lint` green; `shfmt --check` and `shellcheck` on the
  changed scripts; `pnpm check` in agent-skills.
- Functional, per repo: run `sh .config/git/hooks/heal.sh` in a clone.
  Branch with a `.tool-versions` bump, check it out, watch the hook fire
  the heal. Run one heal in the background and a second in the
  foreground — the second waits for the lock.
- One real commit through the hooks per repo; lint-staged formats the
  new files.

## Left to the builder

- None. All decisions are settled above.

## Future work

- The github repo's reusable `pnpm.yml` pins `node-version` in plain
  text, apart from `.tool-versions`. One pin could feed both.
