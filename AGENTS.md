<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Subtree AI - AI Agent Skills Repository

Reusable AI coding agent skills for Java, Gradle, GitHub, shell scripting,
development planning, and documentation workflows. This repository is published
as the user-level skill plugin `xenoterracide-agent-skills`, and its `skills/`
directory doubles as an OpenCode-compatible HTTP skill catalog.

- **Repository**: https://github.com/xenoterracide/agent-skills
- **License for skills/docs**: CC-BY-NC-SA-4.0
- **License for configuration files**: CC0-1.0

> **Agent Note:** This repo is the plugin source for
> `xenoterracide-agent-skills` — not the Superpowers plugin, not an installed
> plugin directory. Make all skill and plugin changes in this repository, then
> reinstall. Never edit files under `~/.kimi-code/`, `~/.kimi-plugin/`,
> `~/.config/opencode/`, or any other agent installation directory.

## Source of Truth

| For                                  | See                              |
| ------------------------------------ | -------------------------------- |
| Install, update, usage, contribution | `README.md` (read this first)    |
| Kimi plugin manifest, skill layout   | `.kimi-plugin/plugin.json`       |
| OpenCode plugin entrypoint           | `index.js`                       |
| OpenCode project config              | `.opencode/opencode.json`        |
| OpenCode skill catalog               | `skills/index.json`              |
| Skills directory                     | `skills/`                        |
| Node version                         | `.tool-versions`                 |
| Scripts and Node dependencies        | `package.json`, `pnpm-lock.yaml` |
| Python dependencies                  | `pyproject.toml`, `uv.lock`      |
| Conventional commit types            | `git-conventional-commits.yaml`  |
| Pre-commit rules (license + format)  | `.lintstagedrc.cjs`              |
| Toolchain healing                    | `.config/git/hooks/heal.sh`      |
| Renovate config                      | `.github/renovate.json5`         |

## Build and Test

Run setup once with:

```bash
npm run contribute
```

With direnv, entering the repository runs `.envrc`, which installs pinned
tools, dependencies, and the git hooks.

### Lint and Format

```bash
pnpm lint                         # prettier + REUSE checks
pnpm lint:prettier                # Prettier check with cache
pnpm lint:reuse                   # REUSE license compliance check
pnpm exec prettier --write <file> # Format a single file
```

### Test

Tests are TypeScript — `*.test.ts` under `vitest`. Reserve `*.mjs` for
files `node` executes directly, like `scripts/generate-skill-catalog.mjs`.

```bash
pnpm check                        # typecheck + eslint + catalog + tests
pnpm test                         # Plugin tests (node) + unit tests (vitest)
pnpm test:opencode                # Plugin tests only
node --test scripts/*.test.mjs    # Same tests without pnpm
pnpm typecheck                    # tsc --noEmit
pnpm lint:eslint                  # ESLint only
```

### Skill Evals

`skills/*/tests/evals.test.ts` asserts that realistic prompts auto-load the
skill. Each case forks `opencode run` in a temp copy of `skills/` and
`.opencode/` with an isolated `XDG_CONFIG_HOME`; the skill must load in all
three runs. Cases may also assert reference reads or forbid commands via
`assertSkillBehavior`.

```bash
pnpm evals                        # unit tests + every skill case
pnpm evals skills/java-creator    # one skill
```

Evals are on demand and never run in CI. `EVAL_MODEL` and `EVAL_ITERATIONS`
override the defaults. The suite bails at the first failure. Evaluate on a
full-size coding model — flash-tier variants flake on companion and routing
compliance, loading the primary skill while skipping its companions.

The default reporter prints nothing until the suite ends, so a long run looks
stuck and a killed run leaves no trace. Stream per-test progress instead:

```bash
pnpm exec vitest run --reporter=verbose 2>&1 | tee /tmp/opencode/evals.log
```

A full run takes an hour or more; use a background shell and read the log. A
failure quoting `Policy budget exceeded` or `Free usage limit reached` means
the provider quota ran dry — point `EVAL_MODEL` at another provider or wait
for the reset.

### Git Hooks

Hooks live in `.config/git/hooks`.

- **pre-commit**: Runs `lint-staged` — prettier, shfmt, license annotation,
  and shellcheck on changed files.
- **commit-msg**: Validates conventional commit messages against
  `git-conventional-commits.yaml`.
- **post-checkout / post-merge**: Run `heal.sh` when pins or lockfiles
  changed between revisions.

All hooks exit early when the `CI` environment variable is set.

### Dependencies

The repository uses pnpm. Its isolated `node_modules` keeps undeclared
dependencies unresolvable while the typechecker reads the tree.

If `pnpm` vanishes after a Node version change, use the `version-managers`
skill (`references/corepack-troubleshooting.md`) before anything else.

### OpenCode Plugin

`index.js` is the OpenCode V2 plugin entrypoint, referenced by `main` in
`package.json`. It registers every `skills/*/SKILL.md`, registers the `javadocs`
MCP server in locations with Java build markers when absent, and injects a
one-time `using-xenoterracide-agent-skills` bootstrap. It has
no runtime dependencies and must never throw into OpenCode. Behavior is covered
by `scripts/opencode-plugin.test.mjs`.

`.opencode/opencode.json` exposes `./skills` for contributors and deliberately
does not load the plugin — the maintainer's global configuration already does;
loading it twice would register every skill twice.

## Code Style

### EditorConfig

The `.editorconfig` file lives at the repository root.

### Prettier

See `.prettierrc.cjs` for the full config.

### Licensing by File Type

`.lintstagedrc.cjs` is the source of truth for license headers. Use this table
when creating new files:

| File type                              | License           | Formatter        |
| -------------------------------------- | ----------------- | ---------------- |
| `*.ts`, `*.java`                       | GPL-3.0-or-later  | Prettier         |
| `*.js`, `*.cjs`, `*.mjs`, `*.yml`      | MIT               | Prettier         |
| `package.json`                         | MIT               | Prettier         |
| `*.json` (non-package)                 | CC0-1.0           | Prettier         |
| `*.md`, `*.adoc`                       | CC-BY-NC-SA-4.0   | Prettier         |
| `*.xml`, `*.yaml`, `*.toml`, `*.json5` | CC0-1.0           | Prettier         |
| `*.*sh`, `.config/git/hooks/*`         | MIT (shfmt style) | shfmt + Prettier |
| `*.properties`                         | CC0-1.0           | Prettier         |
| dotfiles (`.gitignore`, etc.)          | CC0-1.0           | Prettier         |

> Markdown skill files do **not** receive REUSE headers. Place the SPDX block
> inside an HTML comment immediately after the YAML frontmatter.

## Maintenance

- Update this file when you change workflows it describes.
- Update `CONTRIBUTING.md` when you change contributor-facing workflows or
  commands.
- Versions follow CalVer `YY.M.MICRO`. When modifying skills or plugin
  behavior, ask the user whether to bump the version in `.kimi-plugin/plugin.json`
  and `package.json` before creating or updating the PR.
- After adding, removing, or moving skills, regenerate the OpenCode catalog with
  `pnpm skills:catalog` so `skills/index.json` stays in sync (kept in check by
  `pnpm skills:check` as part of `pnpm lint`). The catalog version is read from
  `.kimi-plugin/plugin.json`; bump it when skill contents change so OpenCode
  refreshes cached copies.
- Run `pnpm test:opencode` when changing the plugin. The entrypoint is
  intentionally dependency-free so Git and local-directory installs work.
- Keep `.opencode/opencode.json` limited to `./skills`.

## Worktrees

Feature work happens in a git worktree, never directly on `develop`. Prefer
the harness's native worktree tool; it places worktrees outside the repo. A
project-local `.worktrees/` is the fallback location and is ignored by
`.gitignore` — an unignored worktree directory commits the whole tree.
Worktree branches appear in normal `git branch` output, marked `+`.

## Security Considerations

- **CI detection**: Git hooks exit early when `CI` is set.
- **Lockfile integrity**: Use `pnpm install --frozen-lockfile` and `uv sync --frozen`.
- **No force push**: Repository rules block force pushes.
- **Confirmed merges only**: Agents never merge the PR on their own
  initiative, by any route. The merge waits for the human's explicit yes; an
  instruction from before the human read the PR is not confirmation. Syncing
  a topic branch with `ghb pr sync` is safe routine sync.
- **No secrets**: This repository contains no credentials or private
  configuration.

## License

- **Skills and documentation**: CC-BY-NC-SA-4.0
- **Configuration files**: CC0-1.0
