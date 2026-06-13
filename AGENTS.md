# Subtree AI - AI Agent Skills Repository

SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0

---

## Project Overview

This repository is **Subtree AI**, also published as the user-level skill plugin
`xenoterracide-agent-skills`. It ships reusable AI coding agent skills for Java,
Gradle, GitHub, shell scripting, development planning, and documentation
workflows.

- **Repository**: https://github.com/xenoterracide/agent-skills
- **Primary target**: Kimi Code CLI via `.kimi-plugin/plugin.json`
- **Compatible agents**: any [agentskills.io](https://agentskills.io)-standard
  agent such as Claude Code, Copilot CLI, or Gemini CLI
- **Content type**: Markdown documentation/knowledge files (no compiled
  application code in `skills/`)
- **License for skills and docs**: CC-BY-NC-SA-4.0
- **License for configuration files**: CC0-1.0

> **Agent Note:** Always read `README.md` before answering questions about
> installing, updating, or using this plugin. It contains the canonical
> instructions for the current Kimi Code CLI plugin system.
>
> **Source of Truth:** This repository IS the `xenoterracide-agent-skills`
> plugin. Agents **MUST NOT** edit installed plugin files in `~/.kimi-code/`,
> `~/.kimi-plugin/`, or any agent installation directory. Treat installed plugins
> as immutable binaries, not modifiable source. Make all changes in this repo and
> reinstall from here when needed.

## Repository Structure

```
.
├── .kimi-plugin/plugin.json     # Kimi plugin manifest
├── .github/renovate.json5       # Renovate dependency update config
├── .github/workflows/pre-commit.yml   # CI: REUSE + Prettier checks
├── .lintstagedrc.cjs            # Per-file-type license + format rules
├── .prettierrc.cjs              # Prettier config (printWidth 120)
├── .tool-versions               # Node.js version for asdf
├── git-conventional-commits.yaml    # Conventional commit types
├── mcp/mcp.json                 # MCP server config (javadocs)
├── package.json                 # Node project scripts and dev deps
├── pyproject.toml               # Python project metadata (uv)
├── skills/                      # Skill definitions
│   ├── agents-creator/
│   ├── code-quality/
│   │   ├── coding-standards/
│   │   └── testing/
│   ├── development-planning/
│   │   ├── iterative-development/
│   │   └── use-case-creator/
│   ├── session-init/                # Git state verification at session start
│   ├── git-workflow/
│   │   ├── commit-message/
│   │   └── pull-request/
│   ├── github/
│   ├── gradle/
│   ├── java/
│   ├── shell-script/
│   └── docs-creator/                # Project docs and skill authoring
│       ├── skill-creator/
│       ├── agents-creator/
│       ├── readme-creator/
│       └── contributing-creator/
└── .share/                      # Shared tooling subtree (template-main)
    ├── git/hooks/               # Pre-commit, commit-msg, post-checkout, post-merge
    ├── node/packages/merge/     # TypeScript AI-assisted PR merge tool
    ├── package.json             # Root config for the shared tooling workspace
    └── AGENTS.md                # Conventions for the shared tooling itself
```

## Technology Stack

- **Node.js**: 24.14.1 (managed by `asdf` via `.tool-versions`)
- **Package manager**: Yarn 4.13.0 with Plug'n'Play (`.pnp.cjs`)
- **Python**: 3.12+ (managed by `uv`)
- **Formatting**: Prettier 3.6.2 with plugins for XML, Properties, Java, and
  TOML
- **License compliance**: REUSE specification via `reuse` (Python dev
  dependency)
- **Git hooks**: Stored in `.share/git/hooks`; active path is
  `.share/git/hooks`
- **CI**: GitHub Actions reusing workflows from
  `xenoterracide/github/.github/workflows`

## Build and Test Commands

All commands below assume dependencies are installed. Run setup once with:

```bash
yarn contribute
```

This runs `uv sync --frozen` and configures `core.hooksPath` to
`.share/git/hooks`.

### Linting and Formatting

```bash
yarn lint                         # Run prettier + REUSE checks
yarn lint:prettier                # Prettier check with cache
yarn lint:reuse                   # REUSE license compliance check
yarn exec prettier --write <file> # Format a single file
```

### Testing

```bash
yarn test                         # Run all workspace tests
```

The only current testable code lives in `.share/node/packages/merge/`. The
skill files themselves are documentation and have no automated tests.

### Merge Workflows (AI-Assisted PR Merge Tool)

The `.share/node/packages/merge` package provides engine-specific merge scripts
that generate conventional commit PR messages and drive squash merges:

```bash
yarn merge:kimi                   # Generate/update PR with Kimi engine
yarn merge:junie                  # Generate/update PR with Junie engine
yarn merge:copilot                # Generate/update PR with Copilot engine
```

### Dependency Management

```bash
yarn install --immutable          # Install Node dependencies
uv sync --frozen                  # Sync Python dependencies
```

- `yarn.lock` and `uv.lock` are committed and checked for immutability in CI.
- Renovate (`.github/renovate.json5`) manages npm, asdf, GitHub Actions,
  Python, and Maven dependencies. It uses squash automerge for eligible minor,
  patch, and pin updates.

## Code Style Guidelines

### EditorConfig

- Charset: UTF-8
- Line endings: LF
- Indent: 2 spaces
- Final newline: required

The `.editorconfig` file lives inside `.share/` and is applied through the
shared tooling subtree.

### Prettier

```javascript
// .prettierrc.cjs
{
  printWidth: 120,
  xmlWhitespaceSensitivity: "ignore",
  keySeparator: "=",
  plugins: [
    "@prettier/plugin-xml",
    "prettier-plugin-properties",
    "prettier-plugin-java",
    "prettier-plugin-toml",
  ],
}
```

### Licensing by File Type

`.lintstagedrc.cjs` defines the license header applied by the pre-commit hook.
Use it as the source of truth for new files:

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

> Markdown skill files do **not** receive REUSE headers in this repo because
> REUSE does not handle YAML frontmatter correctly. The SPDX block is placed
> inside an HTML comment immediately after the frontmatter.

### Skill File Format

Each skill is a directory containing `SKILL.md`:

```markdown
---
name: skill-name
description: |
  When to use this skill. Be specific about triggers.
license: CC-BY-NC-SA-4.0
metadata:
  author: Caleb Cushing <caleb.cushing@gmail.com>
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Skill Title

Content here...
```

**Critical rules:**

1. `---` must be the very first line of the file.
2. Frontmatter must include `name` and `description`.
3. SPDX copyright comment goes **after** frontmatter in an HTML comment block.
4. Use the current year (2026) for new skills.
5. Keep the body concise; put detailed reference material in a `references/`
   directory when needed.

## Testing Instructions

- **Skill files**: There are no automated tests. Validate by:
  - Correct YAML frontmatter (use `---` first, include `name` and
    `description`).
  - Prettier formatting passes.
  - REUSE compliance passes for non-Markdown assets.
  - Manual verification that the skill content matches the stated trigger.
- **Merge tool**: Run `yarn workspaces foreach --all run test` or
  `yarn workspace merge run test` to execute TypeScript type checking and
  Vitest tests in `.share/node/packages/merge/`.

When a skill contains shell commands or Gradle tasks, verify the commands work
by running them directly and update the skill immediately if they fail.

## Git Workflow

### Conventional Commits

Allowed types are defined in `git-conventional-commits.yaml`:

```yaml
- ci, feat, fix, perf, refactor, style, test
- build, ops, docs, chore, merge, revert
```

The `commit-msg` hook validates every commit message against this convention.

### Pull Request Workflow

This repository uses **squash merge** for PRs:

- Branch history does not matter; all commits are squashed.
- Use `git merge origin/<default-branch>` instead of rebase to update a branch.
- Do not create new branches for updates; commit to the same PR branch.
- PR titles must follow conventional commit format.
- PR descriptions must explain **why** the change exists.
- Do **not** use checkboxes (`- [x]`) in PR descriptions; use plain bullets.
- Never force push; force pushes are blocked by repository rules.

### Git Hooks

Hooks live in `.share/git/hooks` and are configured via
`git config core.hooksPath .share/git/hooks`:

- **pre-commit**: Runs `lint-staged` to format and annotate licenses.
- **commit-msg**: Validates conventional commit messages.
- **post-checkout / post-merge**: Syncs Node or Python dependencies when
  lockfiles changed.

All hooks exit early when `CI` is set.

### Session Initialization

At the start of every session, load `git-workflow/session-init` logic:

1. Read `README.md` and this `AGENTS.md`.
2. Run `git fetch --all --prune`.
3. Check current branch and git status.
4. Check PR state with `gh pr view --json number,url,headRefName,state` or an
   MCP tool.
5. If the current branch's PR is CLOSED or MERGED, switch to the default
   branch, delete the stale branch, and pull latest before creating new work.

## Skill Routing

Skills are grouped into four activation categories. Use this index when the
right skill is not obvious:

| Skill                                        | Scope                                                  | Activate When                                                                         |
| -------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `session-init`                               | Git state verification at session start                | Starting work in a repo session                                                       |
| `git-workflow/pull-request`                  | Commit, push, and PR lifecycle                         | Any repository file is created, modified, or deleted; PR review comments              |
| `git-workflow/commit-message`                | Conventional commit and PR description formatting      | Writing a commit message, PR title, or PR description                                 |
| `code-quality/coding-standards`              | Cross-language coding principles and quality standards | Implementing or changing code in any language                                         |
| `code-quality/testing`                       | Test philosophy, patterns, and anti-patterns           | Adding, updating, debugging, or discussing tests                                      |
| `development-planning/iterative-development` | Iteration planning and domain model evolution          | Scoping a feature, selecting an iteration, or refining design                         |
| `development-planning/use-case-creator`      | Use case specifications in Cockburn/AsciiDoc format    | Writing or revising use cases and business behavior docs                              |
| `github`                                     | GitHub platform tools, APIs, and GraphQL queries       | Querying or interacting with GitHub-hosted resources                                  |
| `java`                                       | Java language conventions and null-safety              | Creating or modifying `.java` source files                                            |
| `gradle`                                     | Gradle build system and dependency management          | Editing Gradle build files or resolving dependency issues                             |
| `shell-script`                               | Shell scripting for POSIX, Bash, and Zsh               | Writing or editing shell scripts, functions, or shell config                          |
| `docs-creator/skill-creator`                 | Creating and maintaining AI skill definitions          | Working on `SKILL.md` files or skill trigger behavior                                 |
| `docs-creator/agents-creator`                | Creating and maintaining project `AGENTS.md` files     | Writing, revising, or generating agent instructions at the project or directory level |
| `docs-creator/readme-creator`                | Creating and maintaining project `README.md` files     | Writing or revising the project README                                                |
| `docs-creator/contributing-creator`          | Creating and maintaining `CONTRIBUTING.md` files       | Writing or revising human contributor guidance                                        |

### Maintenance Rule

If you modify anything this `AGENTS.md` describes (workflows, tools, file
layouts, skill conventions, licensing, etc.), update `AGENTS.md` in the same
change. Do not let agent instructions drift out of sync with the project.

## Security Considerations

1. **CI detection**: All git hooks check `[ -n "$CI" ]` and exit early in CI
   environments.
2. **Lockfile integrity**: Use `yarn install --immutable` and `uv sync --frozen`
   so lockfiles cannot change unexpectedly.
3. **Command injection**: The merge tool prefers `execFileSync` with argv
   arrays for safe command execution.
4. **No secrets**: This repository contains no credentials or private
   configuration. `mcp/mcp.json` only references a public javadocs MCP server.
5. **Force push blocked**: Repository rules block force pushes; agents must
   create new commits instead.

## License

- **Skills and documentation**: CC-BY-NC-SA-4.0
- **Configuration files**: CC0-1.0

---

SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
