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
- **OpenCode**: installable as a native V2 plugin or via its
  [HTTP skill catalog](https://opencode.ai/v2/docs/skills/)

## Installation

### Kimi Code CLI

```bash
/plugins install https://github.com/xenoterracide/agent-skills
```

Then start a new session (`/new`) for skills to activate.

### OpenCode

OpenCode V2 can load this repository as a plugin. The plugin:

- registers every skill in `skills/`;
- registers the `javadocs` MCP server in Java projects when no `javadocs` entry
  exists;
- injects a one-time `using-xenoterracide-agent-skills` bootstrap into the first
  user message.

Install it globally:

```bash
opencode plugin add github:xenoterracide/agent-skills
```

Or add the equivalent entry to `~/.config/opencode/opencode.jsonc`, or to a
project `opencode.json`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      "package": "github:xenoterracide/agent-skills",
      "options": {
        "sessionInit": true,
        "javadocs": "auto",
      },
    },
  ],
}
```

`sessionInit` defaults to `true`. Set `sessionInit: false` to skip the
bootstrap.

`javadocs` defaults to `auto`: it registers only when the directory OpenCode is
opened in contains `pom.xml`, `build.gradle(.kts)`, `settings.gradle(.kts)`,
`mvnw`, or `gradlew`. Set `javadocs: true` to register everywhere, or
`javadocs: false` to disable it. In a monorepo whose build files live above the
opened directory, set `javadocs: true` or open the repository root. An existing
`javadocs` entry is never overwritten. For a local checkout, use an absolute
directory path instead of the Git specifier. Restart OpenCode or let it reload
its configuration after installing.

You only need one OpenCode install path. If the HTTP catalog below is also
configured, the plugin skips skill IDs that already exist.

#### HTTP skill catalog (alternative)

The `skills/` directory doubles as an
[HTTP skill catalog](https://opencode.ai/v2/docs/skills/). It ships with a
generated `index.json` (regenerate with `pnpm skills:catalog`) and is served
directly from GitHub raw.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "skills": ["https://raw.githubusercontent.com/xenoterracide/agent-skills/develop/skills/"],
}
```

The catalog does not provide the `using-xenoterracide-agent-skills` bootstrap or
automatic MCP registration. Add the server yourself if you need it:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "javadocs": {
        "type": "remote",
        "url": "https://www.javadocs.dev/mcp",
      },
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

Skills live one level deep under `skills/`. Closely-related skills ship as a
single skill that routes to `references/` files (`git-workflow`, `docs-creator`).
See [`AGENTS.md`](AGENTS.md#skill-routing) for the full skill routing table.

## Development

- See [`AGENTS.md`](AGENTS.md) for project conventions, skill routing, and
  agent-specific guidance.
- See [`CONTRIBUTING.md`](CONTRIBUTING.md) for human contributor setup, linting,
  testing, and pull request workflow.
- Use the [`docs-creator`](skills/docs-creator/SKILL.md) skill when writing or
  revising `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, or a `SKILL.md` file.
  The authoring guidance lives in `skills/docs-creator/references/`.
- Use the [`git-workflow`](skills/git-workflow/SKILL.md) skill when creating or
  updating PRs, writing commits, or recovering from a workflow-scope push
  rejection.
- When adding or moving skills, run `pnpm skills:catalog` to regenerate the
  OpenCode catalog at `skills/index.json`.

## License

- **Skills and documentation**: [CC-BY-NC-SA-4.0](LICENSES/CC-BY-NC-SA-4.0.txt)
- **Configuration files**: [CC0-1.0](LICENSES/CC0-1.0.txt)

These skills are provided for personal and non-commercial use only. They are
**not intended for use in the development of commercial software** without
explicit permission.

For commercial licensing inquiries, please contact the author.
