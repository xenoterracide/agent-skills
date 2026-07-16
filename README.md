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

Skills are organized into bundles — `git-workflow`, `development-planning`,
and `docs-creator` — plus standalone skills for `java-creator`,
`gradle-creator`, `github`, `shell-script-creator`, and `session-init`.

See [`AGENTS.md`](AGENTS.md#skill-routing) for the full skill routing table.

## Development

- See [`AGENTS.md`](AGENTS.md) for project conventions, skill routing, and
  agent-specific guidance.
- See [`CONTRIBUTING.md`](CONTRIBUTING.md) for human contributor setup, linting,
  testing, and pull request workflow.
- Use the [`skill-creator`](skills/skill-creator/SKILL.md) skill when adding or
  updating skills.
- Use the [`agents-creator`](skills/agents-creator/SKILL.md) skill when writing
  or revising `AGENTS.md` files.
- Use the [`readme-creator`](skills/readme-creator/SKILL.md) skill when writing
  or revising `README.md` files.
- Use the [`contributing-creator`](skills/contributing-creator/SKILL.md) skill
  when writing or revising `CONTRIBUTING.md` files.

## License

- **Skills and documentation**: [CC-BY-NC-SA-4.0](LICENSES/CC-BY-NC-SA-4.0.txt)
- **Configuration files**: [CC0-1.0](LICENSES/CC0-1.0.txt)

These skills are provided for personal and non-commercial use only. They are
**not intended for use in the development of commercial software** without
explicit permission.

For commercial licensing inquiries, please contact the author.
