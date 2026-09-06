<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Xenoterracide's Agent Skills

A user-level skill plugin for AI coding agents. It ships reusable skills for
Java, Gradle, GitHub, shell scripting, development planning, and documentation
workflows.

> **Requires:** This plugin is designed to be used alongside the
> [Superpowers plugin](https://github.com/obra/superpowers). Several skills
> reference Superpowers process-discipline skills such as
> `verification-before-completion` and `requesting-code-review`.

- **Primary target**: [Kimi Code CLI](https://kimi.com/code)
- **Compatible with**: any [agentskills.io](https://agentskills.io)-standard
  agent such as Claude Code, Copilot CLI, or Gemini CLI
- **OpenCode**: installable via its [skill catalog](https://opencode.ai/docs/skills/)

## Installation

### Kimi Code CLI

```bash
/plugins install https://github.com/xenoterracide/agent-skills
```

Then start a new session (`/new`) for skills to activate.

### OpenCode

The repo-root `skills/` directory doubles as an
[HTTP skill catalog](https://opencode.ai/v2/docs/skills/). It ships with a
generated `index.json` (regenerate with `yarn skills:catalog`) and is served
directly from GitHub raw.

Add the catalog URL and the `javadocs` MCP server to `opencode.json` (project or
`~/.config/opencode/opencode.json`):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "skills": {
    "urls": ["https://raw.githubusercontent.com/xenoterracide/agent-skills/develop/skills/"],
  },
  "mcp": {
    "javadocs": {
      "type": "remote",
      "url": "https://www.javadocs.dev/mcp",
    },
  },
}
```

### Manual (any agent)

Copy the `skills/` directory into your agent's skill discovery path:

- **Kimi**: `~/.kimi-code/skills/` or `.kimi-code/skills/`
- **Claude Code**: `~/.claude/skills/` or `.claude/skills/`
- **Copilot CLI**: `~/.copilot/skills/` or `.github/skills/`
- **OpenCode**: `~/.config/opencode/skills/` or `.agents/skills/`

## Skills

Skills are organized as a flat collection. See
[`AGENTS.md`](AGENTS.md#skill-routing) for the full skill routing table.

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
- When adding or moving skills, run `yarn skills:catalog` to regenerate the
  OpenCode catalog at `skills/index.json`.

## License

- **Skills and documentation**: [CC-BY-NC-SA-4.0](LICENSES/CC-BY-NC-SA-4.0.txt)
- **Configuration files**: [CC0-1.0](LICENSES/CC0-1.0.txt)

These skills are provided for personal and non-commercial use only. They are
**not intended for use in the development of commercial software** without
explicit permission.

For commercial licensing inquiries, please contact the author.
