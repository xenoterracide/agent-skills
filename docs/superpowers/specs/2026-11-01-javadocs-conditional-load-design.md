<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Conditional Javadocs MCP Loading Design

## Intent

The `xenoterracide-agent-skills` plugin is global, so the `javadocs` MCP server
currently connects in every project, including non-JVM ones. MCP tools consume
model context, and the remote server adds a connection and startup cost. Load
`javadocs` only where it is useful: a location that looks like a Java/JVM
project.

## Goals

1. Register `javadocs` only when the plugin's location has Java build markers.
2. Keep skills and the session bootstrap global and unchanged.
3. Preserve `javadocs: false`, `javadocs: true`, and "never overwrite an
   existing `javadocs` entry".

## Non-goals

- Lazy or on-demand loading from a skill activation, prompt keyword, or command.
  That is a later design.
- Deep or nested module discovery. Only the location root is inspected.
- Changing the MCP URL, transport, or the Kimi manifest behavior.

## Decisions

- `javadocs` option:
  - `false` → never register.
  - `true` → always register (opts out of detection).
  - omitted or `"auto"` (default) → register only when markers are present.
- Markers checked directly in `ctx.location.directory`:
  `pom.xml`, `build.gradle`, `build.gradle.kts`, `settings.gradle`,
  `settings.gradle.kts`, `mvnw`, `mvnw.cmd`, `gradlew`, `gradlew.bat`.
- Detection is a shallow root check. A monorepo whose Java module is nested
  needs `javadocs: true` or a project-local entry.
- If `ctx.location?.directory` is unavailable, register rather than silently
  disabling the server, preserving current behavior.

## Implementation

- Add `JAVA_PROJECT_MARKERS` and `isJavaProject(directory)` to `index.js`.
- `registerJavadocs(ctx, mode)` chooses `always` or `auto`, and in `auto` checks
  the markers before calling `ctx.mcp.transform`.
- Keep the existing `editor.get("javadocs")` guard.

## Tests

- `auto` + marker → registers.
- `auto` + no marker → does not register.
- `javadocs: true` + no marker → registers.
- `javadocs: false` → does not register.
- Existing entry is not overwritten.
- Missing `ctx.location` → registers.

## Files

- `index.js`
- `scripts/opencode-plugin.test.mjs`
- `README.md` (document the option and markers)
