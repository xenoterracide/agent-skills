# Subtree AI - AI Agent Skills Repository

SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0

---

## Project Overview

This repository contains **AI coding agent skills** designed for use with Kimi Code CLI (and compatible AI coding agents). Skills are modular, composable capabilities that provide specialized knowledge, workflow patterns, and tool integrations to enhance AI agent effectiveness.

The project is hosted at: https://github.com/xenoterracide/subtree-ai

## Repository Structure

```
.
├── mcp/                     # Model Context Protocol configuration
│   ├── mcp.json            # MCP server configuration (currently empty {})
│   └── mcp.json.license    # CC0-1.0 license for config files
├── skills/                  # AI skills organized by concern
│   ├── commit-message/     # Conventional commit and PR description format
│   ├── general-programming/ # Cross-cutting programming principles
│   ├── github/             # GitHub and GraphQL interaction patterns
│   ├── gradle/             # Gradle build system and dependency management
│   ├── iterative-development/ # Planning and iterative design guidance
│   ├── java/               # Java coding style and null-safety guidance
│   ├── pull-request/       # Commit, push, and PR workflow management
│   ├── session-init/       # Mandatory session startup workflow
│   ├── skill-creator/      # Creating and maintaining skills
│   ├── testing/            # Testing philosophy and patterns
│   └── use-case-creator/   # Use case documentation guidance
└── .agents/                # Symlink to root (self-referential)
    └── skills/             # Same as ./skills/
```

## Technology Stack

This is a **documentation/knowledge repository** (not a code project):

- **Format**: Markdown with YAML frontmatter for skill definitions
- **Documentation**: AsciiDoc for use case specifications
- **Formatting**: Prettier for Markdown
- **Licensing**: SPDX license identifiers (CC-BY-NC-SA-4.0 for content, CC0-1.0 for config)

## Skill System Architecture

### Skill File Format

Each skill is a directory containing `SKILL.md` with this structure:

```markdown
---
name: skill-name
description: When to use this skill. Be specific about triggers.
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Skill Title

Content here...
```

**CRITICAL FORMATTING RULES:**
1. `---` must be the VERY FIRST line in the file - no comments, no blank lines before
2. Frontmatter must include `name` and `description` fields
3. SPDX copyright comment goes AFTER frontmatter, in an HTML comment block
4. Use current year (2026) for new skills, not a range

### How Skills Work

Skills are recognized by Kimi when:
1. File is named exactly `SKILL.md`
2. Located in `.agents/skills/<skill-name>/` or `skills/<skill-name>/`
3. Frontmatter is valid (starts with `---`)
4. Has both `name` and `description` fields

The `description` field determines when the skill triggers, so it is the primary
machine-readable routing surface. Keep descriptions specific, concrete, and easy
to match against user intent.

Only `name` and `description` belong in frontmatter. Put extra routing guidance
such as anti-triggers, related skills, and detailed examples in the body of the
skill file rather than inventing new frontmatter keys.

## Skill Categories

### Workflow Skills (Always Apply)

| Skill | Primary Trigger | Pair With |
|-------|-----------------|-----------|
| `session-init` | **ALWAYS** at the start of every new session | Everything else |
| `pull-request` | **ALWAYS** when files are modified, created, or deleted | Relevant domain skill(s), `commit-message`, `general-programming` |
| `commit-message` | Writing a commit message or PR description | `pull-request` |

### Cross-Cutting Skills

| Skill | Primary Trigger | Pair With |
|-------|-----------------|-----------|
| `general-programming` | Any coding, refactoring, or bug-fixing task | Language, build, and testing skills |

### Domain Skills (Apply by Context)

| Skill | Primary Trigger | Pair With |
|-------|-----------------|-----------|
| `github` | Interacting with GitHub repos, issues, pull requests, or GraphQL | `pull-request` |
| `java` | Creating or modifying `.java` source files | `general-programming`, `testing`, `gradle` |
| `gradle` | Editing `build.gradle.kts`, `settings.gradle.kts`, `gradle.properties`, or dependency versions | `java`, `pull-request` |
| `testing` | Creating, modifying, or discussing tests | `general-programming`, language-specific skills |
| `use-case-creator` | Writing use cases or documenting system behavior in AsciiDoc | `iterative-development` |

### Planning and Meta Skills

| Skill | Primary Trigger | Pair With |
|-------|-----------------|-----------|
| `iterative-development` | Starting a feature, planning an iteration, or evolving the domain model | `use-case-creator`, implementation skills |
| `skill-creator` | Creating or updating skills, or fixing skill formatting/trigger problems | `pull-request` |

## AI Discoverability Index

Use this table as the canonical routing guide when deciding which skill to load.

| Skill | Use When | Avoid When | Common Signals |
|-------|----------|------------|----------------|
| `session-init` | Beginning repository work in a new session | You already completed startup checks in this session | "start work", "new session", "check branch" |
| `pull-request` | Any repository file will change | Read-only investigation with no edits | "fix", "update", "add", "refactor", "rename" |
| `commit-message` | You need a commit subject/body or PR description | General prose that is not commit/PR text | "write commit", "PR title", "PR description" |
| `general-programming` | Implementing or changing code in any language | Pure repo administration with no code changes | "implement", "refactor", "bug", "error handling" |
| `github` | Using GitHub issues, PRs, reviews, comments, or GraphQL | Purely local git or filesystem work | "GitHub", "review comments", "issue", "PR thread" |
| `java` | Touching `.java` files or Java language constructs | Only build config or docs are changing | `.java`, class, interface, record, enum |
| `gradle` | Touching Gradle files or dependency-locking/build problems | Non-build files only | `build.gradle.kts`, `settings.gradle.kts`, `gradle.properties`, dependency |
| `testing` | Adding, updating, debugging, or discussing tests | Feature work with no test impact or discussion | test, coverage, fixture, integration |
| `use-case-creator` | Writing or revising use cases and business behavior docs | Implementation-only work | use case, scenario, semantic anchor, ubiquitous language |
| `iterative-development` | Scoping a feature, selecting an iteration, or refining the model | Mechanical single-file edits with no design work | iteration, vertical slice, domain model, risk |
| `skill-creator` | Working on `skills/**/SKILL.md` or skill trigger behavior | Normal product/application code changes | skill, frontmatter, trigger wording, discoverability |

## Development Workflow

### Making Changes

1. **Start with session-init skill** - Verify branch state before any work
2. **Apply cross-cutting and domain-specific skills** as needed for the task
3. **Always use pull-request skill** when modifying files
4. **Follow commit-message skill** for commit/PR formatting
5. **Use the AI Discoverability Index above** when the correct skill is not obvious

### Formatting Skills

After editing any `SKILL.md` file:

```bash
yarn exec prettier --write skills/<skill-name>/SKILL.md
```

### Creating New Skills

1. Create directory: `skills/<skill-name>/`
2. Create `SKILL.md` with proper frontmatter (see `skill-creator` skill)
3. Add SPDX license comment after frontmatter
4. Add a precise trigger-oriented `description`
5. Add clear "when not to use" and related skill guidance in the body
6. Run prettier to format
7. Follow pull-request workflow to submit

## Code Style Guidelines

### For Java Projects (referenced skills)

- Prefer `var` keyword over explicit types
- Prefer immutability (`final` fields, `record` classes, `List.of()`)
- Prefer package-private visibility over `private` (except fields)
- Use non-nullability by default with `@Nullable` for nullable types
- Avoid `internal` packages - use package-private instead
- Use builder pattern with `@Builder` from immutables library

### For Skill Files

- Keep skills concise - they share context window
- Use clear, specific descriptions for triggers
- Use the same trigger vocabulary in `AGENTS.md` and each skill description
- Add negative guidance when confusion with another skill is likely
- Put detailed info in references/, keep `SKILL.md` focused
- Fix broken commands immediately - skills are living documents

## Testing

Skills themselves don't have automated tests (they're documentation). However:

- Skills should be validated for correct frontmatter format
- Prettier ensures consistent Markdown formatting
- Skills are tested by usage - if a skill's command doesn't work, update it immediately

For testing strategies in code projects, see the `testing` skill which covers:
- Prefer sociable and integration tests over solitary unit tests
- Use real collaborators, not mocks
- Test observable behavior through public APIs
- Target 90%+ coverage

## Pull Request Workflow

This repository uses **squash merge** for PRs:

- Branch history doesn't matter - all commits get squashed
- Use `git merge origin/develop` instead of rebase when updating
- Don't create new branches for updates - commit to same branch
- PR titles must follow conventional commit format (they become commit messages)
- PR descriptions must explain WHY the change exists
- Do NOT use checkboxes (`- [x]`) in PR descriptions - use plain bullets

## License

All skills are licensed under **CC-BY-NC-SA-4.0** (Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International).

Configuration files (like `mcp.json`) are licensed under **CC0-1.0** (public domain dedication).

---

SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
