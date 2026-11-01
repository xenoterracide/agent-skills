<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Conditional Javadocs MCP Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register the `javadocs` MCP server only in locations that look like Java/JVM projects.

**Architecture:** Add a shallow marker check (`isJavaProject`) and an option-driven mode to `registerJavadocs`. `setup` passes `always` when `javadocs === true`; the default `auto` mode checks `ctx.location.directory` before registering.

**Tech Stack:** Node.js ESM, `node:test`, `node:assert/strict`, `node:fs`, `node:path`.

**Spec:** `docs/superpowers/specs/2026-11-01-javadocs-conditional-load-design.md`

## Global Constraints

- `javadocs` defaults to `auto`: register only when markers are present.
- `javadocs: true` always registers; `javadocs: false` never registers.
- An existing `javadocs` entry is never overwritten.
- Missing `ctx.location` falls back to registering.
- Markers: `pom.xml`, `build.gradle`, `build.gradle.kts`, `settings.gradle`, `settings.gradle.kts`, `mvnw`, `mvnw.cmd`, `gradlew`, `gradlew.bat`.
- No skill-triggered/lazy loading, nested discovery, or Kimi manifest change.
- Version bump is decided with the user before the PR.

## Review Focus

- A directory with no build file or wrapper must not register javadocs.
- A wrapper-only directory (`gradlew`) counts as a Java project.
- A missing `ctx.location` must not silently disable javadocs.
- An existing `javadocs` entry, including `disabled: true`, must stay untouched.
- `javadocs: true` must still register outside Java projects.

---

### Task 1: Marker detection and auto mode

**Files:**

- Modify: `index.js` (`node:fs` import, `registerJavadocs`, `setup`)
- Modify: `scripts/opencode-plugin.test.mjs` (imports, `createContext`, javadocs tests)
- Modify: `README.md` (OpenCode plugin section)

**Interfaces:**

- Produces: `JAVA_PROJECT_MARKERS: readonly string[]`; `isJavaProject(directory: string | undefined): boolean`; `registerJavadocs(ctx, mode?: "auto" | "always"): Promise<void>`.
- Consumes: `ctx.options.javadocs` in `setup`.

- [ ] **Step 1: Write the failing tests**

Update the test import in `scripts/opencode-plugin.test.mjs`:

```js
import plugin, { DEFAULT_SKILLS_DIRECTORY, isJavaProject } from "../index.js";
```

Extend `createContext` to accept and expose a location:

```js
function createContext({
  options = {},
  existingSkills = [],
  existingMcp = {},
  parentID,
  rejectSkillIDs = [],
  location,
} = {}) {
  // ...
  const ctx = {
    options,
    location,
    skill: {
```

Add this helper near the other helpers:

```js
function createProjectDirectory(files = []) {
  const directory = mkdtempSync(join(tmpdir(), "agent-skills-project-"));
  for (const file of files) writeFileSync(join(directory, file), "");
  return directory;
}
```

Add these tests after the existing javadocs tests:

```js
test("registers javadocs in an auto-detected Java project", async () => {
  const directory = createProjectDirectory(["pom.xml"]);
  try {
    const { ctx, mcp } = createContext({ location: { directory } });
    await plugin.setup(ctx);

    assert.deepEqual(mcp.get("javadocs"), {
      type: "remote",
      url: "https://www.javadocs.dev/mcp",
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("does not register javadocs outside a Java project", async () => {
  const directory = createProjectDirectory();
  try {
    const { ctx, mcp } = createContext({ location: { directory } });
    await plugin.setup(ctx);

    assert.equal(mcp.has("javadocs"), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("registers javadocs everywhere when javadocs is true", async () => {
  const directory = createProjectDirectory();
  try {
    const { ctx, mcp } = createContext({
      options: { javadocs: true },
      location: { directory },
    });
    await plugin.setup(ctx);

    assert.deepEqual(mcp.get("javadocs"), {
      type: "remote",
      url: "https://www.javadocs.dev/mcp",
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("isJavaProject recognizes build files and wrappers", () => {
  const gradle = createProjectDirectory(["build.gradle.kts"]);
  const wrapper = createProjectDirectory(["gradlew"]);
  const plain = createProjectDirectory();
  try {
    assert.equal(isJavaProject(gradle), true);
    assert.equal(isJavaProject(wrapper), true);
    assert.equal(isJavaProject(plain), false);
    assert.equal(isJavaProject(undefined), false);
  } finally {
    rmSync(gradle, { recursive: true, force: true });
    rmSync(wrapper, { recursive: true, force: true });
    rmSync(plain, { recursive: true, force: true });
  }
});
```

Rename the existing test `"registers javadocs when absent"` to
`"registers javadocs when the location is unavailable"`; its body and
assertion stay the same.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test scripts/*.test.mjs`
Expected: FAIL — `isJavaProject` is not exported, and the auto/non-Java cases do not exist yet.

- [ ] **Step 3: Implement the marker check and mode in `index.js`**

Add `existsSync` to the `node:fs` import:

```js
import { existsSync, readdirSync, readFileSync } from "node:fs";
```

Add the constant and helper before `registerJavadocs`:

```js
export const JAVA_PROJECT_MARKERS = [
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "settings.gradle.kts",
  "mvnw",
  "mvnw.cmd",
  "gradlew",
  "gradlew.bat",
];

export function isJavaProject(directory) {
  if (!directory) return false;
  return JAVA_PROJECT_MARKERS.some((marker) => existsSync(join(directory, marker)));
}
```

Replace `registerJavadocs` with:

```js
export async function registerJavadocs(ctx, mode = "auto") {
  if (mode === "auto") {
    const directory = ctx.location?.directory;
    if (directory && !isJavaProject(directory)) return;
  }

  await ctx.mcp.transform((editor) => {
    if (editor.get("javadocs")) return;
    editor.set("javadocs", { type: "remote", url: JAVADOCS_MCP_URL });
  });
}
```

In `setup`, pass the mode:

```js
await registerJavadocs(ctx, options.javadocs === true ? "always" : "auto");
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/*.test.mjs`
Expected: PASS, 0 failures.

- [ ] **Step 5: Update `README.md`**

Change the plugin bullet to mention the Java-project condition, and replace
the options paragraph:

```markdown
- registers the `javadocs` MCP server in Java projects when no `javadocs` entry
  exists;
```

```markdown
`sessionInit` defaults to `true`. Set `sessionInit: false` to skip the
bootstrap.

`javadocs` defaults to `auto`: it registers only when the project root contains
`pom.xml`, `build.gradle(.kts)`, `settings.gradle(.kts)`, `mvnw`, or `gradlew`.
Set `javadocs: true` to register everywhere, or `javadocs: false` to disable it.
An existing `javadocs` entry is never overwritten.
```

Update the example options block to:

```jsonc
"options": {
  "sessionInit": true,
  "javadocs": "auto",
},
```

- [ ] **Step 6: Format and verify**

Run: `yarn install --immutable && yarn exec prettier --write index.js scripts/opencode-plugin.test.mjs README.md`
Expected: files reformatted with no errors.

Run: `node --test scripts/*.test.mjs`
Expected: PASS, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add index.js scripts/opencode-plugin.test.mjs README.md docs/superpowers/specs/2026-11-01-javadocs-conditional-load-design.md docs/superpowers/plans/2026-11-01-javadocs-conditional-load.md
git commit -m "feat(opencode): load javadocs only in Java projects"
```
