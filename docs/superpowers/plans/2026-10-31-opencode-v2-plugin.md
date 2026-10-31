<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# OpenCode V2 Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make this repository a valid OpenCode V2 plugin that registers its skills, registers the `javadocs` MCP server, bootstraps `session-init`, and ships native V2 configuration and documentation.

**Architecture:** A zero-dependency ESM `index.js` at the repository root exports `{ id, setup }`. `setup` registers every `skills/*/SKILL.md` through `ctx.skill.transform`, adds `javadocs` through `ctx.mcp.transform` only when absent, and installs one guarded `ctx.session.hook("context")` that injects a marker-delimited `session-init` instruction into the first user message. The package stays installable from Git or a local directory, while the Kimi manifest and HTTP catalog remain unchanged.

**Tech Stack:** Node 24 ESM, Node built-ins (`node:fs`, `node:path`, `node:url`), `node:test`, OpenCode V2 plugin API, Prettier, REUSE.

**Spec:** `docs/superpowers/specs/2026-10-31-opencode-v2-plugin-design.md`

## Global Constraints

- Target OpenCode V2 only. Do not add a V1 `server()` export or `@opencode-ai/plugin` dependency.
- The plugin must have zero runtime dependencies and use only Node built-ins.
- Default export shape: `{ id: "xenoterracide-agent-skills", setup }`.
- Plugin `id` must stay `xenoterracide-agent-skills`.
- Never let `setup`, a transform callback, or a hook throw into OpenCode. Catch and log every failure.
- Skill records are `{ id, name, description, path, content }`. The ID is the directory name.
- Do not overwrite an existing skill ID. Skip it.
- Do not overwrite an existing `javadocs` MCP entry, including one with `disabled: true`.
- The session bootstrap marker is exactly `xenoterracide-agent-skills/session-init`.
- The `javadocs` MCP URL is exactly `https://www.javadocs.dev/mcp`.
- Bump the plugin version from `0.3.0` to `0.4.0`.
- `.js` and `.mjs` files use the MIT SPDX header. Markdown documents use CC-BY-NC-SA-4.0.
- Formatting is Prettier with `printWidth: 120`, 2-space indentation, LF, final newline.
- The pinned Node version is `24.22.1` in `.tool-versions`. If `node -v` fails, run `asdf install nodejs 24.22.1` before running test commands.
- Do not modify files under `.kimi-plugin/` except `plugin.json`'s `version`.
- Do not modify skill bodies. The `commit-message` to `commit-creator` rename is pre-existing working-tree work.

## Review Focus

- A user already has a custom `javadocs` MCP server, possibly disabled: the plugin must leave it untouched.
- A project has `.opencode/skills/session-init/SKILL.md` overriding the bundled one: the plugin must not replace it.
- A prompt already contains the bootstrap marker after compaction, reload, or a retry: the plugin must not duplicate it.
- The session is a child/subagent session: the plugin must not inject session-start instructions.
- A `SKILL.md` has missing or malformed frontmatter: that skill is skipped, and every other skill still registers.
- The plugin is loaded with a missing V2 domain or a V1-shaped context: `setup` must resolve without throwing.

---

## File Structure

- `index.js` — plugin entrypoint, frontmatter parser, skill/MCP/session registration.
- `scripts/opencode-plugin.test.mjs` — unit tests with a fake V2 context.
- `package.json` — ESM mode, `main`, version, test scripts.
- `.opencode/opencode.json` — repo-local native V2 config exposing `./skills`.
- `.kimi-plugin/plugin.json` — version bump only.
- `skills/index.json` — regenerated catalog.
- `scripts/generate-skill-catalog.mjs` — V2 comment update only.
- `README.md` — OpenCode install and behavior documentation.
- `AGENTS.md` — source-of-truth, test command, and maintenance updates.
- `docs/superpowers/specs/2026-10-31-opencode-v2-plugin-design.md` — approved design.
- Delete: `.opencode/package.json`, `.opencode/package-lock.json`, `.opencode/node_modules/`.

---

### Task 1: Loadable plugin and native skill registration

**Files:**

- Create: `index.js`
- Create: `scripts/opencode-plugin.test.mjs`
- Modify: `package.json`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `export const DEFAULT_SKILLS_DIRECTORY: string`
  - `export function parseFrontmatter(source: string): { data: Record<string, string>, body: string }`
  - `export function parseSkillFile(filePath: string, source: string): { id: string, name: string, description: string, path: string, content: string } | undefined`
  - `export async function registerSkills(ctx, skillsDirectory?: string): Promise<void>`
  - default export `{ id: "xenoterracide-agent-skills", setup(ctx): Promise<void> }`

- [ ] **Step 1: Write the failing skill-registration tests**

Create `scripts/opencode-plugin.test.mjs` with a fake context helper and these tests:

```js
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readdirSync } from "node:fs";
import test from "node:test";

import plugin, { DEFAULT_SKILLS_DIRECTORY } from "../index.js";

function createContext({ options = {}, existingSkills = [], existingMcp = {}, parentID } = {}) {
  const skills = [...existingSkills];
  const mcp = new Map(Object.entries(existingMcp));
  let contextHook;
  let skillTransformCalls = 0;
  let mcpTransformCalls = 0;

  const ctx = {
    options,
    skill: {
      async transform(callback) {
        skillTransformCalls += 1;
        callback({
          list: () => skills,
          get: (id) => skills.find((skill) => skill.id === id),
          add: (skill) => skills.push(skill),
          update: () => {},
          remove: () => {},
        });
        return { dispose: async () => {} };
      },
    },
    mcp: {
      async transform(callback) {
        mcpTransformCalls += 1;
        callback({
          list: () => [...mcp.entries()],
          get: (name) => mcp.get(name),
          set: (name, value) => mcp.set(name, value),
          update: () => {},
          remove: () => {},
        });
        return { dispose: async () => {} };
      },
    },
    session: {
      async hook(name, handler) {
        assert.equal(name, "context");
        contextHook = handler;
        return { dispose: async () => {} };
      },
      async get({ sessionID }) {
        return { id: sessionID, parentID };
      },
    },
  };

  return {
    ctx,
    skills,
    mcp,
    getContextHook: () => contextHook,
    getSkillTransformCalls: () => skillTransformCalls,
    getMcpTransformCalls: () => mcpTransformCalls,
  };
}

test("registers every bundled skill", async () => {
  const { ctx, skills } = createContext();
  await plugin.setup(ctx);

  const expected = readdirSync(DEFAULT_SKILLS_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(skills.map((skill) => skill.id).sort(), expected);
  for (const skill of skills) {
    assert.equal(skill.path.endsWith("SKILL.md"), true);
    assert.equal(skill.content.startsWith("---"), false);
    assert.ok(skill.name);
    assert.ok(skill.description);
  }
});

test("does not overwrite an existing skill ID", async () => {
  const existing = {
    id: "session-init",
    name: "Custom",
    description: "Custom description",
    path: "/custom/SKILL.md",
    content: "custom",
  };
  const { ctx, skills } = createContext({ existingSkills: [existing] });
  await plugin.setup(ctx);

  const sessionInit = skills.find((skill) => skill.id === "session-init");
  assert.equal(sessionInit, existing);
});

test("skips a malformed skill and registers the rest", async () => {
  const directory = mkdtempSync(join(tmpdir(), "agent-skills-test-"));
  try {
    mkdirSync(join(directory, "good"));
    writeFileSync(join(directory, "good", "SKILL.md"), "---\nname: good\ndescription: Good skill\n---\nBody\n");
    mkdirSync(join(directory, "bad"));
    writeFileSync(join(directory, "bad", "SKILL.md"), "no frontmatter\n");

    const { ctx, skills } = createContext();
    const { registerSkills } = await import("../index.js");
    await registerSkills(ctx, directory);

    assert.deepEqual(
      skills.map((skill) => skill.id),
      ["good"],
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("setup resolves when V2 domains are missing", async () => {
  await assert.doesNotReject(() => plugin.setup({}));
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/opencode-plugin.test.mjs`
Expected: FAIL because `../index.js` does not exist.

- [ ] **Step 3: Implement the package entrypoint and skill registration**

In `package.json`, add `"version": "0.4.0"`, `"type": "module"`, `"main": "index.js"`, and these scripts (replace the existing `test` script):

```json
"test": "node --test scripts/*.test.mjs",
"test:opencode": "node --test scripts/opencode-plugin.test.mjs"
```

In `index.js`, implement:

- `DEFAULT_SKILLS_DIRECTORY` using `fileURLToPath(new URL("./skills/", import.meta.url))`.
- `parseFrontmatter` returns `{ data, body }`, supports `|` and `>` block scalars, strips matching quotes from plain values, and ignores nested keys.
- `parseSkillFile` returns `undefined` when frontmatter is absent or has no `name`; otherwise it derives `id` from `basename(dirname(filePath))`, defaults `name` to the ID, defaults `description` to `""`, and strips frontmatter from `content`.
- `registerSkills(ctx, skillsDirectory)` reads sorted directories, parses each `SKILL.md`, and adds missing IDs inside one `ctx.skill.transform` callback. Wrap each `editor.add` in `try/catch`; skip when `editor.get(skill.id)` exists.
- `setup(ctx)` reads `ctx.options ?? {}`, calls `registerSkills` when `ctx.skill?.transform` is a function, and catches/logs every failure. Log one `console.warn` when the skill domain is unavailable. Do not throw.

The plugin ID is `xenoterracide-agent-skills`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/opencode-plugin.test.mjs`
Expected: PASS for all four tests.

- [ ] **Step 5: Commit**

```bash
git add package.json index.js scripts/opencode-plugin.test.mjs
git commit -m "feat(opencode): add v2 plugin entrypoint and skill registration"
```

---

### Task 2: Register the javadocs MCP server

**Files:**

- Modify: `index.js`
- Modify: `scripts/opencode-plugin.test.mjs`

**Interfaces:**

- Consumes: `createContext`, `plugin.setup` from Task 1.
- Produces: `export async function registerJavadocs(ctx): Promise<void>` and support for the `javadocs` option.

- [ ] **Step 1: Write the failing MCP tests**

Add:

```js
test("registers javadocs when absent", async () => {
  const { ctx, mcp } = createContext();
  await plugin.setup(ctx);

  assert.deepEqual(mcp.get("javadocs"), {
    type: "remote",
    url: "https://www.javadocs.dev/mcp",
  });
});

test("does not overwrite an existing javadocs entry", async () => {
  const existing = { type: "remote", url: "https://custom.example/mcp", disabled: true };
  const { ctx, mcp } = createContext({ existingMcp: { javadocs: existing } });
  await plugin.setup(ctx);

  assert.equal(mcp.get("javadocs"), existing);
});

test("skips MCP registration when javadocs is false", async () => {
  const { ctx, mcp, getMcpTransformCalls } = createContext({ options: { javadocs: false } });
  await plugin.setup(ctx);

  assert.equal(mcp.has("javadocs"), false);
  assert.equal(getMcpTransformCalls(), 0);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/opencode-plugin.test.mjs`
Expected: FAIL because `javadocs` is never registered.

- [ ] **Step 3: Implement `registerJavadocs`**

In `index.js`:

- Export `async function registerJavadocs(ctx)` that calls `ctx.mcp.transform` and returns early when `editor.get("javadocs")` is truthy; otherwise calls `editor.set("javadocs", { type: "remote", url: "https://www.javadocs.dev/mcp" })`.
- In `setup`, call it when `options.javadocs !== false` and `ctx.mcp?.transform` is a function, inside its own `try/catch` with a `console.warn`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/opencode-plugin.test.mjs`
Expected: PASS for all seven tests.

- [ ] **Step 5: Commit**

```bash
git add index.js scripts/opencode-plugin.test.mjs
git commit -m "feat(opencode): register javadocs mcp server"
```

---

### Task 3: Bootstrap session-init at session start

**Files:**

- Modify: `index.js`
- Modify: `scripts/opencode-plugin.test.mjs`

**Interfaces:**

- Consumes: `createContext`, `plugin.setup` from Task 1.
- Produces:
  - `export const BOOTSTRAP_MARKER = "xenoterracide-agent-skills/session-init"`
  - `export function buildSessionBootstrap(): string`
  - `export async function registerSessionInit(ctx): Promise<void>`
  - support for the `sessionInit` option.

- [ ] **Step 1: Write the failing session tests**

Add:

```js
test("injects the session-init bootstrap once", async () => {
  const { ctx, getContextHook } = createContext();
  await plugin.setup(ctx);

  const event = {
    sessionID: "ses_1",
    messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }],
  };
  await getContextHook()(event);
  await getContextHook()(event);

  const text = event.messages[0].content[0].text;
  assert.equal(text.includes("xenoterracide-agent-skills/session-init"), true);
  assert.equal(text.includes("`session-init`"), true);
  assert.equal(
    event.messages[0].content.filter((part) => part.text.includes("xenoterracide-agent-skills/session-init")).length,
    1,
  );
});

test("skips the bootstrap for child sessions", async () => {
  const { ctx, getContextHook } = createContext({ parentID: "ses_parent" });
  await plugin.setup(ctx);

  const event = { sessionID: "ses_child", messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }] };
  await getContextHook()(event);

  assert.equal(event.messages[0].content[0].text, "hello");
});

test("skips the bootstrap when the marker already exists", async () => {
  const { ctx, getContextHook } = createContext();
  await plugin.setup(ctx);

  const text = "prefix xenoterracide-agent-skills/session-init suffix";
  const event = { sessionID: "ses_1", messages: [{ role: "user", content: [{ type: "text", text }] }] };
  await getContextHook()(event);

  assert.equal(event.messages[0].content.length, 1);
  assert.equal(event.messages[0].content[0].text, text);
});

test("does not register the session hook when sessionInit is false", async () => {
  const { ctx, getContextHook } = createContext({ options: { sessionInit: false } });
  await plugin.setup(ctx);

  assert.equal(getContextHook(), undefined);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/opencode-plugin.test.mjs`
Expected: FAIL because no context hook is registered.

- [ ] **Step 3: Implement `registerSessionInit`**

In `index.js`:

- `BOOTSTRAP_MARKER` is the const from the global constraints.
- `buildSessionBootstrap()` returns a short `<EXTREMELY_IMPORTANT>` block that includes the marker and tells the agent to invoke the `session-init` skill before any other action.
- `registerSessionInit(ctx)` calls `ctx.session.hook("context", handler)`. The handler:
  - returns when `event.messages` is not an array;
  - returns when `ctx.session.get({ sessionID: event.sessionID })` resolves with a `parentID`;
  - returns when any text part already includes `BOOTSTRAP_MARKER`;
  - prepends `{ type: "text", text: buildSessionBootstrap() }` to the first user message's content, or pushes a new user message when none exists;
  - catches all errors and logs with `console.warn`.
- In `setup`, call it when `options.sessionInit !== false` and `ctx.session?.hook` is a function, inside its own `try/catch`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/opencode-plugin.test.mjs`
Expected: PASS for all eleven tests.

- [ ] **Step 5: Commit**

```bash
git add index.js scripts/opencode-plugin.test.mjs
git commit -m "feat(opencode): bootstrap session-init at session start"
```

---

### Task 4: Replace the broken repo-local OpenCode configuration

**Files:**

- Modify: `.opencode/opencode.json`
- Delete: `.opencode/package.json`
- Delete: `.opencode/package-lock.json`
- Delete: `.opencode/node_modules/`

**Interfaces:**

- Consumes: nothing.
- Produces: a native V2 project config with no plugin named `list`.

- [ ] **Step 1: Replace `.opencode/opencode.json`**

Write:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "skills": ["./skills"],
}
```

- [ ] **Step 2: Remove the abandoned V1 experiment files**

```bash
rm -rf .opencode/package.json .opencode/package-lock.json .opencode/node_modules
```

- [ ] **Step 3: Verify OpenCode no longer sees the `list` plugin**

Run: `opencode debug config`
Expected: the repo document has `"skills": ["./skills"]`, and no `plugins` entry containing `"list"`.

- [ ] **Step 4: Commit**

```bash
git add .opencode/opencode.json
git commit -m "fix(opencode): replace broken project plugin config"
```

---

### Task 5: Bump the version and regenerate the catalog

**Files:**

- Modify: `.kimi-plugin/plugin.json`
- Modify: `scripts/generate-skill-catalog.mjs`
- Modify: `skills/index.json`

**Interfaces:**

- Consumes: the plugin version is `0.4.0` from Task 1.
- Produces: catalog entries with `"version": "0.4.0"`.

- [ ] **Step 1: Bump `.kimi-plugin/plugin.json`**

Change `"version": "0.3.0"` to `"version": "0.4.0"`. Do not change anything else in the file.

- [ ] **Step 2: Update the catalog generator comment**

Replace the comment that describes `skills.urls` and OpenCode 1.18.x with a description of the V2 `skills` array and HTTP catalog. Do not change generator behavior.

- [ ] **Step 3: Regenerate the catalog**

Run: `yarn skills:catalog`
Expected: `wrote skills/index.json (N skills, version 0.4.0)`.

If `yarn` cannot find Node, run `asdf install nodejs 24.22.1` and repeat.

- [ ] **Step 4: Verify the catalog is current**

Run: `yarn skills:check`
Expected: `skill catalog is up to date (N skills, version 0.4.0)`.

- [ ] **Step 5: Commit**

```bash
git add .kimi-plugin/plugin.json scripts/generate-skill-catalog.mjs skills/index.json
git commit -m "chore: bump plugin version and regenerate skill catalog"
```

---

### Task 6: Document the plugin install and behavior

**Files:**

- Modify: `README.md`
- Modify: `AGENTS.md`

**Interfaces:**

- Consumes: plugin ID, options, and behavior from Tasks 1-3; version 0.4.0 from Task 5.
- Produces: user-facing install instructions and maintainer guidance.

- [ ] **Step 1: Rewrite the README OpenCode section**

The section must:

- recommend the plugin install;
- show `opencode plugin add github:xenoterracide/agent-skills`;
- show the equivalent native V2 `plugins` entry with `sessionInit` and `javadocs` options;
- state that the plugin registers all skills, registers `javadocs`, and injects the `session-init` bootstrap;
- state that `sessionInit: false` and `javadocs: false` disable those behaviors;
- keep the HTTP catalog as the alternative for agents that cannot load plugins, using the V2 shape `"skills": ["https://raw.githubusercontent.com/xenoterracide/agent-skills/develop/skills/"]`;
- keep the manual copy instructions, including OpenCode's `~/.config/opencode/skills/` path.

- [ ] **Step 2: Update AGENTS.md**

Add or update:

- the plugin entrypoint (`index.js`) and `package.json` `main`/`type` in the source-of-truth table or a nearby paragraph;
- the `yarn test` / `yarn test:opencode` commands in the test section;
- the OpenCode V2 install shape in the maintenance notes;
- a note that `.opencode/opencode.json` exposes `./skills` and must not load the plugin twice.

- [ ] **Step 3: Format the docs**

Run: `yarn exec prettier --write README.md AGENTS.md docs/superpowers/specs/2026-10-31-opencode-v2-plugin-design.md docs/superpowers/plans/2026-10-31-opencode-v2-plugin.md`
Expected: files are rewritten with no errors.

- [ ] **Step 4: Commit**

```bash
git add README.md AGENTS.md docs/superpowers/specs/2026-10-31-opencode-v2-plugin-design.md docs/superpowers/plans/2026-10-31-opencode-v2-plugin.md
git commit -m "docs: document opencode v2 plugin install"
```

---

### Task 7: Update the maintainer global configuration

**Files:**

- Modify: `~/.config/opencode/opencode.jsonc`

**Interfaces:**

- Consumes: plugin at `/home/ai/agent-skills` from Tasks 1-3.
- Produces: native V2 global config that loads Superpowers and this plugin.

- [ ] **Step 1: Replace the file contents**

Write:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "superpowers@git+https://github.com/obra/superpowers.git",
    {
      "package": "/home/ai/agent-skills",
      "options": {
        "sessionInit": true,
        "javadocs": true,
      },
    },
  ],
  "lsp": true,
}
```

Do not keep the V1 `skills.urls` entry. The plugin now registers the same skills.

- [ ] **Step 2: Verify the normalized configuration**

Run: `opencode debug config`
Expected: global document has `plugins` with both entries and no `skills` array; the repo document has `"skills": ["./skills"]`.

- [ ] **Step 3: Verify the plugin is discovered**

Run: `opencode plugin list`
Expected: the list includes `xenoterracide-agent-skills` with source `/home/ai/agent-skills`.

If it is missing, check the server log for a plugin load error before changing the design. Do not restart the shared service during this session; note the required restart for the user if the running server has already cached the old config.

- [ ] **Step 4: Record the post-merge follow-up**

Add one line to the plan or PR description: replace the local path with the Git package specifier after the branch merges, or run `opencode plugin add github:xenoterracide/agent-skills`.

No Git commit is made for this task; the file lives outside the repository.

---

### Task 8: Final verification

**Files:**

- No new files unless a verification step requires a fix.

**Interfaces:**

- Consumes: every task above.
- Produces: verified tests, lint, and configuration.

- [ ] **Step 1: Run the plugin tests**

Run: `node --test scripts/opencode-plugin.test.mjs`
Expected: all eleven tests pass, zero failures.

- [ ] **Step 2: Run the full test command**

Run: `yarn test`
Expected: the same plugin tests pass through the new `test` script.

- [ ] **Step 3: Run the repository lint**

Run: `yarn lint`
Expected: Prettier, REUSE, and `skills:check` all pass.

If `yarn` cannot find Node, run `asdf install nodejs 24.22.1` and repeat.

- [ ] **Step 4: Verify the repo config**

Run: `opencode debug config`
Expected: no `list` plugin, `"skills": ["./skills"]` in the repo document, and the plugin in the global document.

- [ ] **Step 5: Inspect the working tree**

Run: `git status --short`
Expected: only intended files are modified or added. The pre-existing `commit-creator` rename and skill edits remain, but no `.opencode/node_modules` or lockfile leftovers are staged.

- [ ] **Step 6: Commit any verification fixes**

If a verification step changed a tracked file:

```bash
git add <changed-files>
git commit -m "fix(opencode): address verification findings"
```

If nothing changed, skip this step.

---

## Self-Review Notes

- Spec coverage: all nine spec goals map to Tasks 1-8. The global config goal maps to Task 7; the human-required CI workflow is documented in the spec and remains a follow-up.
- Type consistency: `BOOTSTRAP_MARKER`, `buildSessionBootstrap`, `registerSkills`, `registerJavadocs`, and `registerSessionInit` are defined in the task that first uses them.
- Review Focus items: custom MCP, skill override, duplicate marker, child session, malformed skill, and missing V2 domains each have a test in Tasks 1-3.
- The plan does not change skill bodies or the Kimi manifest beyond the version.
