<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Subtree AI - AI Agent Skills Repository

Reusable AI coding agent skills for Java, Gradle, GitHub, shell scripting,
development planning, and documentation workflows. This repository is also
published as the user-level skill plugin `xenoterracide-agent-skills`.

- **Repository**: https://github.com/xenoterracide/agent-skills
- **License for skills/docs**: CC-BY-NC-SA-4.0
- **License for configuration files**: CC0-1.0

> **Agent Note:** This repo IS the plugin source. Do not edit installed plugin
> files in `~/.kimi-code/`, `~/.kimi-plugin/`, or any agent installation
> directory. Make changes here and reinstall from this repo.

## Source of Truth

| For                                    | See                             |
| -------------------------------------- | ------------------------------- |
| Install, update, usage, contribution   | `README.md` (read this first)   |
| Plugin manifest, skill layout, version | `.kimi-plugin/plugin.json`      |
| Node version                           | `.tool-versions`                |
| Scripts and Node dependencies          | `package.json`                  |
| Python dependencies                    | `pyproject.toml`, `uv.lock`     |
| Conventional commit types              | `git-conventional-commits.yaml` |
| Pre-commit rules (license + format)    | `.lintstagedrc.cjs`             |
| Renovate config                        | `.github/renovate.json5`        |

## Build and Test

Run setup once with:

```bash
yarn contribute
```

### Lint and Format

```bash
yarn lint                         # prettier + REUSE checks
yarn lint:prettier                # Prettier check with cache
yarn lint:reuse                   # REUSE license compliance check
yarn exec prettier --write <file> # Format a single file
```

### Test

```bash
yarn test                         # All workspace tests
yarn workspace merge run test     # Merge tool only
```

### Merge Workflows

```bash
yarn merge:kimi                   # Generate/update PR with Kimi engine
yarn merge:junie                  # Generate/update PR with Junie engine
yarn merge:copilot                # Generate/update PR with Copilot engine
```

### Dependency Sync

```bash
yarn install --immutable
uv sync --frozen
```

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
| `*.js`, `*.cjs`, `*.yml`               | MIT               | Prettier         |
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

| Skill                                        | Activate When                                               |
| -------------------------------------------- | ----------------------------------------------------------- |
| `session-init`                               | Starting work in a repo session                             |
| `git-workflow.pull-request`                  | Creating/updating PRs, committing, pushing, review comments |
| `git-workflow.commit-message`                | Writing commit messages, PR titles, or PR descriptions      |
| `git-workflow.workflow-push-rejection`       | Push rejected for `.github/workflows` / `workflow` scope    |
| `code-quality.coding-standards`              | Writing or modifying code in any language                   |
| `code-quality.testing`                       | Adding, updating, debugging, or discussing tests            |
| `development-planning.iterative-development` | Scoping or refining designs                                 |
| `development-planning.use-case-creator`      | Writing use cases or business behavior docs                 |
| `github`                                     | GitHub APIs, issues, GraphQL, review threads                |
| `java`                                       | Creating or modifying `.java` files                         |
| `gradle`                                     | Editing Gradle build files or resolving dependencies        |
| `shell-script`                               | Writing or editing shell scripts or shell config            |
| `docs-creator.skill-creator`                 | Creating or editing `SKILL.md` files                        |
| `docs-creator.agents-creator`                | Creating or editing `AGENTS.md` files                       |
| `docs-creator.readme-creator`                | Writing or revising `README.md`                             |
| `docs-creator.contributing-creator`          | Writing or revising `CONTRIBUTING.md`                       |

## Maintenance

- Update this file when you change workflows it describes.
- Update `CONTRIBUTING.md` when you change contributor-facing workflows or
  commands.
- When modifying skills, ask the user whether to bump the plugin version in
  `.kimi-plugin/plugin.json` before creating or updating the PR.

## Security Considerations

- **CI detection**: Git hooks exit early when `CI` is set.
- **Lockfile integrity**: Use `yarn install --immutable` and `uv sync --frozen`.
- **No force push**: Repository rules block force pushes.
- **Command injection**: The merge tool prefers `execFileSync` with argv arrays
  for safe command execution.
- **No secrets**: This repository contains no credentials or private
  configuration.

## License

- **Skills and documentation**: CC-BY-NC-SA-4.0
- **Configuration files**: CC0-1.0
