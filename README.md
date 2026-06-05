<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Xenoterracide's Agent Skills

AI coding agent skills for Java, Gradle, GitHub, and development workflows.
Designed for [Kimi Code CLI](https://kimi.com/code) and compatible with any
[agentskills.io](https://agentskills.io)-standard agent.

## Installation

### Kimi Code CLI

```bash
/plugins install https://github.com/xenoterracide/agent-skills
```

Then start a new session (`/new`) for skills to activate.

### Manual (any agent)

Copy the `skills/` directory into your agent's skill discovery path:

- **Kimi**: `~/.kimi-code/skills/` or `.kimi-code/skills/`
- **Claude Code**: `~/.claude/skills/` or `.claude/skills/`
- **Copilot CLI**: `~/.copilot/skills/` or `.github/skills/`

## Skills

| Skill                   | Scope                                             |
| ----------------------- | ------------------------------------------------- |
| `session-init`          | Branch and PR state verification at session start |
| `coding-standards`      | Cross-language principles and quality standards   |
| `java`                  | Java conventions, JSpecify/NullAway, AssertJ      |
| `gradle`                | Build system and dependency management            |
| `github`                | GitHub CLI, GraphQL, and platform patterns        |
| `shell-script`          | POSIX, Bash, and Zsh scripting guidance           |
| `testing`               | Test philosophy, patterns, and anti-patterns      |
| `commit-message`        | Conventional commit and PR description format     |
| `pull-request`          | Commit, push, and PR lifecycle management         |
| `iterative-development` | Planning and domain model evolution               |
| `use-case-creator`      | Cockburn/AsciiDoc use case specifications         |
| `skill-creator`         | Creating and maintaining agent skills             |

## License

- **Skills and documentation**: [CC-BY-NC-SA-4.0](LICENSES/CC-BY-NC-SA-4.0.txt)
- **Configuration files**: [CC0-1.0](LICENSES/CC0-1.0.txt)

These skills are provided for personal and non-commercial use only. They are
**not intended for use in the development of commercial software** without
explicit permission.

For commercial licensing inquiries, please contact the author.
