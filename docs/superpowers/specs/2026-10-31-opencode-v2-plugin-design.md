<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# OpenCode V2 Plugin Design

## Intent

This repository is already a Kimi plugin and an OpenCode HTTP skill catalog.
OpenCode V2 users currently have to maintain a separate `skills.urls` entry and
copy the `javadocs` MCP server into their own configuration. The repository also
ships a broken leftover `.opencode/opencode.json` that asks OpenCode to load a
plugin named `list`, which logs a failure on every startup in this repo.

The goal is to make the repository installable as a first-class OpenCode V2
plugin that:

- registers every skill in `skills/` natively;
- reproduces Kimi's `sessionStart: { skill: "session-init" }` behavior;
- registers the `javadocs` MCP server;
- keeps the Kimi plugin manifest and HTTP catalog working;
- and upgrades the maintainer's global OpenCode configuration to native V2
  shape without losing Superpowers.

## Goals

1. A valid OpenCode V2 plugin entrypoint in this repository, loadable both from a
   local directory and from a Git package.
2. Native skill registration covering every `skills/*/SKILL.md`.
3. A single, guarded session-start bootstrap that tells the agent to invoke
   `session-init` before other work.
4. Automatic `javadocs` MCP registration that does not overwrite a user's
   existing `javadocs` entry.
5. A repo-local `.opencode/opencode.json` that removes the broken `list`
   placeholder and makes the repository's own skills available without
   double-loading the plugin.
6. README and AGENTS documentation for the plugin install path, the catalog
   alternative, plugin options, and the global config migration.
7. Automated tests for registration, MCP behavior, and session bootstrap.
8. The maintainer's `~/.config/opencode/opencode.jsonc` converted to native V2
   keys and loading this plugin locally.

## Non-goals

- No OpenCode V1 plugin support. V1 plugin implementations do not run in V2, and
  the repository targets V2.
- No TUI, GUI, or RPC plugin parts. The plugin is server-only.
- No npm publication. Installation is from Git or a local directory.
- No change to skill content, except the already-staged `commit-creator` rename.
- No change to the Kimi plugin manifest beyond the version bump.
- No replacement of the HTTP catalog. It remains for agents that cannot load
  plugins.
- No global behavior that mutates user files outside OpenCode configuration.

## Constraints

- OpenCode V2 plugin API: default export with a stable `id` and `setup(ctx)`.
- Skills are registered through `ctx.skill.transform()` using
  `{ id, name, description, path, content }`.
- Session bootstrap uses `ctx.session.hook("context", handler)`.
- MCP servers are registered through `ctx.mcp.transform()`.
- The plugin must never throw out of `setup` or a hook. A failing plugin can
  take down the whole V2 generation.
- The repository uses Yarn PnP and Node 24. The plugin must have zero runtime
  dependencies and use only Node built-ins.
- The root `package.json` is currently private tooling. Git installs ignore
  `private`, but the plugin entrypoint must not depend on installed dev
  dependencies.

## Approaches Considered

### A. Root-level dual-target plugin (chosen)

Add an ESM `index.js` at the repository root, set `"type": "module"` and
`"main": "index.js"` in `package.json`, and implement the V2 plugin there.

- Matches the proven Superpowers layout: `main` for package installs, root
  `index.js` for directory-form installs.
- One package, no publish step, no runtime dependencies.
- A Git install downloads the whole repository, which is small.

### B. Separate `opencode/` package inside the repository

A self-contained package with its own `package.json`.

- Cleaner separation, but `opencode plugin add` cannot install a subdirectory
  from Git. Users would need a clone plus a path entry, or an npm publication.
- More release overhead for no behavioral gain.

### C. Catalog-only fix

Fix the V2 configuration and documentation without adding a plugin.

- Does not provide session-start behavior or automatic MCP registration.
- Rejected because the requested behavior is plugin-only.

## Design

### Plugin entrypoint

- `package.json` gains `"type": "module"`, `"main": "index.js"`, and a
  `"version"` matching the Kimi manifest.
- `index.js` exports `{ id: "xenoterracide-agent-skills", setup }` as its
  default export. A plain object is the V2 contract; no `@opencode/plugin`
  dependency is needed.
- `setup(ctx)` first checks for the V2 domains it needs (`ctx.skill.transform`,
  `ctx.mcp.transform`, `ctx.session.hook`). If they are absent, it logs one
  warning and returns without throwing.
- Each registration step is isolated in `try/catch` so one failure cannot
  disable the plugin or the rest of the OpenCode generation.

### Skill registration

- Read `skills/*/SKILL.md` relative to the plugin file, not the working
  directory.
- The skill ID is the directory name. The display name and description come
  from YAML frontmatter. The content is the Markdown body with frontmatter
  removed.
- The frontmatter parser supports the shapes used in this repository: plain
  values, quoted values, and `|`/`>` block scalars with indented continuation
  lines. It ignores nested keys such as `metadata`.
- Register all skills in one `ctx.skill.transform()` call.
- Do not overwrite an existing skill ID. Project skills, another plugin, or a
  catalog entry with the same ID keep precedence. This matches the
  non-destructive MCP rule.
- Each `editor.add()` is individually guarded so one malformed skill is skipped
  rather than aborting the batch. A duplicate ID is skipped without an error.
- Every registered skill keeps `path` pointing at its `SKILL.md` so supporting
  files stay available.

### Session-start bootstrap

- Register `ctx.session.hook("context", handler)` unless the `sessionInit`
  option is `false`.
- The handler:
  - skips child sessions by checking `ctx.session.get({ sessionID })` for a
    parent ID;
  - skips requests whose messages already contain the bootstrap marker;
  - prepends a short marker-delimited instruction to the first user message (or
    adds a user message when none exists);
  - instructs the agent to invoke the `session-init` skill before other work.
- The marker is `xenoterracide-agent-skills/session-init`, so repeated context
  events and plugin reloads do not duplicate the instruction.
- The handler catches all errors and logs them. A bootstrap failure must never
  break a model request.

### MCP registration

- Register `ctx.mcp.transform()` unless the `javadocs` option is `false`.
- If `javadocs` is already present in the editor, leave it exactly as the user
  configured it, including a `disabled: true` entry.
- Otherwise set:
  `{ type: "remote", url: "https://www.javadocs.dev/mcp" }`.

### Plugin options

```jsonc
{
  "plugins": [
    {
      "package": "/path/to/agent-skills",
      "options": {
        "sessionInit": true,
        "javadocs": true,
      },
    },
  ],
}
```

- `sessionInit` defaults to `true`.
- `javadocs` defaults to `true`.
- Unknown options are ignored.

### Repository configuration

Replace the broken `.opencode/opencode.json` with native V2 configuration that
exposes the repository's own skills without loading the plugin a second time:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "skills": ["./skills"],
}
```

- The maintainer's global plugin already registers these skills and provides
  the session-start bootstrap and MCP server. Loading the plugin again from the
  repo config could register the same plugin ID twice, so the repo config uses
  the declarative skill source instead.
- Contributors who only open this repo still get the skills. They install the
  plugin globally when they want the plugin behavior.
- Remove the leftover `.opencode/package.json`, lockfile, and `node_modules` that
  were created for the abandoned V1 experiment. They are ignored by Git and are
  not needed by a zero-dependency plugin.
- The plugin must still be verified from a local path and from a Git package,
  because those are the documented install paths.

### Catalog generator and versioning

- Update the generator comment from the V1 `skills.urls` shape and OpenCode
  1.18.x to the V2 `skills` array and HTTP catalog.
- Bump `.kimi-plugin/plugin.json` from `0.3.0` to `0.4.0`, because both the
  plugin capability and the catalog contents change.
- Regenerate `skills/index.json` with `yarn skills:catalog`.

### Documentation

- `README.md` gets a recommended OpenCode V2 plugin install:

  ```sh
  opencode plugin add github:xenoterracide/agent-skills
  ```

  plus the equivalent `plugins` entry, plugin options, and the catalog
  alternative using the V2 `skills` array.

- Document that the plugin registers `javadocs` and injects the `session-init`
  bootstrap, and that both can be disabled.
- `AGENTS.md` gets the plugin entrypoint, test command, and the new OpenCode V2
  config shape in its source-of-truth and maintenance sections.
- The Kimi install instructions stay unchanged.

### Maintainer global configuration

The repository's `AGENTS.md` says not to edit files under
`~/.config/opencode/`. This change is an explicit maintainer request, so the
plan edits that one file and nothing else in the installed OpenCode directory.

Convert `~/.config/opencode/opencode.jsonc` to native V2 keys:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "superpowers@git+https://github.com/obra/superpowers.git",
    {
      "package": "/home/ai/agent-skills",
      "options": { "sessionInit": true, "javadocs": true },
    },
  ],
  "lsp": true,
}
```

- Use the local path while the branch is unmerged.
- After merge, replace it with the Git package specifier or run
  `opencode plugin add github:xenoterracide/agent-skills`.
- Remove the V1 `skills.urls` entry because the plugin now registers the same
  skills. Keeping both would create duplicate IDs and unnecessary network
  fetches.
- Keep `lsp: true` to preserve the unrelated existing setting. V2 accepts it
  but does not run language servers.

### Tests

Add `scripts/opencode-plugin.test.mjs` using `node:test` and a fake V2 context.
The tests cover:

- every skill directory is registered with a matching ID;
- every registered skill has a name and description, and content without
  frontmatter;
- `javadocs` is added when absent and left untouched when present;
- `javadocs: false` skips MCP registration;
- an existing skill ID is not overwritten;
- the session bootstrap is injected once, skipped for child sessions, and
  skipped when the marker is already present;
- `sessionInit: false` does not register the context hook;
- a malformed skill does not prevent other skills from registering.

Make the tests part of the normal test command by changing the unused
`workspaces` command to `node --test scripts/*.test.mjs`, and add a
`test:opencode` alias. The repository has no workspaces, so this replaces a
command that currently fails rather than removing working coverage.

The existing GitHub workflows only run Prettier and license checks. Adding a CI
workflow that runs the tests is a human-required follow-up, because agent tokens
cannot push `.github/workflows/` changes.

## Risks and Mitigations

- **Git package install rejects the private root package or missing exports.**
  Mitigation: test a local directory install first, then a `file://` install,
  then a Git specifier before documenting it. Keep the local-path install as a
  supported fallback.
- **Loader does not accept the root directory as a local plugin path.**
  Mitigation: verify both the root-directory path and the package `main`
  entrypoint. Document the working form.
- **A skill rejection disables the plugin.** Mitigation: per-skill `try/catch`
  and a guarded outer `try/catch`.
- **A bundled skill overwrites a project-specific skill.** Mitigation: skip
  existing IDs; only add missing ones.
- **Bootstrap appears in every model request.** Mitigation: marker check on
  existing messages and child-session check.
- **MCP transform overrides user configuration.** Mitigation: check for an
  existing entry first.
- **Duplicate skills from the catalog and plugin.** Mitigation: skip existing
  IDs; remove the catalog entry from the maintainer config; document choosing
  one install path.

## Left to the Builder

- Choose the exact warning messages and log prefix.
- Choose whether the frontmatter parser lives inline or in a small exported
  helper for tests.
- Decide the final branch/PR wording.
- Verify the tested OpenCode release behavior for directory and Git loading and
  adjust the documented install command if needed.
- Confirm the version bump with the maintainer before regenerating the catalog.
