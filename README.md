<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Xenoterracide's Agent Skills

A user-level skill plugin for AI coding agents. It ships reusable skills for
Java, Gradle, GitHub, shell scripting, development planning, and documentation
workflows.

- **Primary target**: [Kimi Code CLI](https://kimi.com/code)
- **Compatible with**: any [agentskills.io](https://agentskills.io)-standard
  agent such as Claude Code, Copilot CLI, or Gemini CLI

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

Skills are organized into bundles — `code-quality`, `git-workflow`,
`development-planning`, and `docs-creator` — plus standalone skills for `java`,
`gradle`, `github`, `shell-script`, and `session-init`.

The plugin also includes proven planning, debugging, review, and delivery
workflows derived from the MIT-licensed
[superpowers](https://github.com/obra/superpowers) project by Jesse Vincent and
contributors. Those files retain their MIT license and copyright notice.

See [`AGENTS.md`](AGENTS.md#skill-routing) for the full skill routing table.

## Development

- See [`AGENTS.md`](AGENTS.md) for project conventions, skill routing, and
  agent-specific guidance.
- See [`CONTRIBUTING.md`](CONTRIBUTING.md) for human contributor setup, linting,
  testing, and pull request workflow.
- Use the [`docs-creator.skill-creator`](skills/docs-creator/skill-creator/SKILL.md)
  skill when adding or updating skills.
- Use the [`docs-creator.agents-creator`](skills/docs-creator/agents-creator/SKILL.md)
  skill when writing or revising `AGENTS.md` files.
- Use the [`docs-creator.readme-creator`](skills/docs-creator/readme-creator/SKILL.md)
  skill when writing or revising `README.md` files.
- Use the [`docs-creator.contributing-creator`](skills/docs-creator/contributing-creator/SKILL.md)
  skill when writing or revising `CONTRIBUTING.md` files.

## License

- **Skills and documentation**: [CC-BY-NC-SA-4.0](LICENSES/CC-BY-NC-SA-4.0.txt)
- **Configuration files**: [CC0-1.0](LICENSES/CC0-1.0.txt)

These skills are provided for personal and non-commercial use only. They are
**not intended for use in the development of commercial software** without
explicit permission.

For commercial licensing inquiries, please contact the author.
