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

> **Agent Note:** This repo **IS** the plugin source for
> `xenoterracide-agent-skills`. It is **NOT** the Superpowers plugin and it is
> **NOT** an installed plugin directory. Make all skill and plugin changes in
> this repository, then reinstall from here. Never edit files under
> `~/.kimi-code/`, `~/.kimi-plugin/`, `~/.config/opencode/`, or any other agent
> installation directory.

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
| Renovate config                      | `.github/renovate.json5`         |

## Build and Test

Run setup once with:

```bash
pnpm contribute
```

### Lint and Format

```bash
pnpm lint                         # prettier + REUSE checks
pnpm lint:prettier                # Prettier check with cache
pnpm lint:reuse                   # REUSE license compliance check
pnpm exec prettier --write <file> # Format a single file
```

### Test

```bash
pnpm test                         # Plugin tests
pnpm test:opencode                # Plugin tests only
node --test scripts/*.test.mjs    # Same tests without pnpm
pnpm typecheck                    # tsc --noEmit
```

### Skill Evals

`skills/*/tests/evals.test.ts` asserts that realistic prompts auto-load the
skill. Each case forks `opencode run` in a temp copy of `skills/` and
`.opencode/` with an isolated `XDG_CONFIG_HOME`; the skill must load in all
three runs.

```bash
pnpm evals                        # helper unit tests + every skill case
pnpm evals skills/java-creator    # one skill
```

Evals are on demand and never run in CI. `EVAL_MODEL` and `EVAL_ITERATIONS`
override the defaults. The suite bails at the first failure.

### Git Hooks

Hooks live in `.share/git/hooks`. `pnpm contribute` sets `core.hooksPath` to
that directory automatically.

- **pre-commit**: Runs `lint-staged` to format and annotate licenses.
- **commit-msg**: Validates conventional commit messages against
  `git-conventional-commits.yaml`.
- **post-checkout / post-merge**: Syncs Node or Python dependencies when
  lockfiles changed.

All hooks exit early when the `CI` environment variable is set.

### Dependency Sync

```bash
pnpm install --frozen-lockfile
uv sync --frozen
```

The repository uses pnpm. Its isolated `node_modules` keeps undeclared
dependencies unresolvable while `tsc` 7, a native binary, reads the tree.

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
does not load the plugin. The maintainer's global configuration loads the
plugin; adding it to the repo config too would register the same plugin twice.

## Code Style

### EditorConfig

- Charset: UTF-8
- Line endings: LF
- Indent: 2 spaces
- Final newline: required

The `.editorconfig` file lives in `.share/`.

### Prettier

See `.prettierrc.cjs` for the full config. Key settings:

- `printWidth: 120`
- `xmlWhitespaceSensitivity: "ignore"`

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

## Skill Routing

Load the relevant skill when the trigger applies:

| Skill                              | Activate When                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| `using-xenoterracide-agent-skills` | Starting work in a repo session, or unsure which skill to use                        |
| `version-managers`                 | Version/launcher tooling — asdf, corepack, direnv — or recovery when one breaks      |
| `completion-checklist`             | About to claim work is complete, fixed, or passing                                   |
| `git-workflow`                     | Creating/updating PRs, committing, pushing, commit/PR messages, push rejection       |
| `coding-standards`                 | Writing or modifying code in any language                                            |
| `testing`                          | Adding, updating, debugging, or discussing tests                                     |
| `iterative-development`            | Scoping or refining designs                                                          |
| `use-case-creator`                 | Writing use cases or business behavior docs                                          |
| `github`                           | GitHub APIs, issues, GraphQL, review threads                                         |
| `java-creator`                     | Creating, modifying, or refactoring Java source files, Maven pom.xml, or JUnit tests |
| `gradle-creator`                   | Creating, modifying, or troubleshooting Gradle builds                                |
| `shell-script-creator`             | Creating, modifying, or debugging shell scripts and commands                         |
| `docs-creator`                     | Writing or revising `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, or `SKILL.md` files |
| `hemingway`                        | Writing prose or code that should be terse and clear                                 |

## Maintenance

- Update this file when you change workflows it describes.
- Update `CONTRIBUTING.md` when you change contributor-facing workflows or
  commands.
- When modifying skills or plugin behavior, ask the user whether to bump the
  version in `.kimi-plugin/plugin.json` and `package.json` before creating or
  updating the PR.
- After adding, removing, or moving skills, regenerate the OpenCode catalog with
  `pnpm skills:catalog` so `skills/index.json` stays in sync (kept in check by
  `pnpm skills:check` as part of `pnpm lint`). The catalog version is read from
  `.kimi-plugin/plugin.json`; bump it when skill contents change so OpenCode
  refreshes cached copies.
- Run `pnpm test:opencode` when changing the plugin. The entrypoint is
  intentionally dependency-free so Git and local-directory installs work.
- Keep `.opencode/opencode.json` limited to `./skills`; the plugin is loaded from
  the user's global configuration, not from the repository config.

## Security Considerations

- **CI detection**: Git hooks exit early when `CI` is set.
- **Lockfile integrity**: Use `pnpm install --frozen-lockfile` and `uv sync --frozen`.
- **No force push**: Repository rules block force pushes.
- **Command injection**: The merge tool prefers `execFileSync` with argv arrays
  for safe command execution.
- **No secrets**: This repository contains no credentials or private
  configuration.

## License

- **Skills and documentation**: CC-BY-NC-SA-4.0
- **Configuration files**: CC0-1.0
