// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import plugin, {
  DEFAULT_SKILLS_DIRECTORY,
  buildAliasBlock,
  isJavaProject,
  parseGitAliasOutput,
  readGitAliases,
} from "../index.js";

function createContext({
  options = {},
  existingSkills = [],
  existingMcp = {},
  gitAliasRunner = () => ({ status: 1, stdout: "" }),
  parentID,
  rejectSkillIDs = [],
  location,
} = {}) {
  const skills = [...existingSkills];
  const mcp = new Map(Object.entries(existingMcp));
  let contextHook;
  let skillTransformCalls = 0;
  let mcpTransformCalls = 0;

  const ctx = {
    options: {
      ...options,
      gitAliases: { ...options.gitAliases, runner: gitAliasRunner },
    },
    location,
    skill: {
      async transform(callback) {
        skillTransformCalls += 1;
        callback({
          list: () => skills,
          get: (id) => skills.find((skill) => skill.id === id),
          add: (skill) => {
            if (rejectSkillIDs.includes(skill.id)) throw new Error(`rejected ${skill.id}`);
            skills.push(skill);
          },
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

function createProjectDirectory(files = []) {
  const directory = mkdtempSync(join(tmpdir(), "agent-skills-project-"));
  for (const file of files) writeFileSync(join(directory, file), "");
  return directory;
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
    id: "using-xenoterracide-agent-skills",
    name: "Custom",
    description: "Custom description",
    path: "/custom/SKILL.md",
    content: "custom",
  };
  const { ctx, skills } = createContext({ existingSkills: [existing] });
  await plugin.setup(ctx);

  const sessionInit = skills.find((skill) => skill.id === "using-xenoterracide-agent-skills");
  assert.equal(sessionInit, existing);
});

test("skips a malformed skill and registers the rest", async () => {
  const directory = mkdtempSync(join(tmpdir(), "agent-skills-test-"));
  const originalWarn = console.warn;
  console.warn = () => {};
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
    console.warn = originalWarn;
    rmSync(directory, { recursive: true, force: true });
  }
});

test("skips a skill rejected by OpenCode and registers the rest", async () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const { ctx, skills } = createContext({ rejectSkillIDs: ["using-xenoterracide-agent-skills"] });
    await plugin.setup(ctx);

    assert.equal(
      skills.some((skill) => skill.id === "using-xenoterracide-agent-skills"),
      false,
    );
    assert.equal(
      skills.some((skill) => skill.id === "testing"),
      true,
    );
  } finally {
    console.warn = originalWarn;
  }
});

test("skips a skill without a name", async () => {
  const directory = mkdtempSync(join(tmpdir(), "agent-skills-test-"));
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    mkdirSync(join(directory, "good"));
    writeFileSync(join(directory, "good", "SKILL.md"), "---\nname: good\ndescription: Good skill\n---\nBody\n");
    mkdirSync(join(directory, "nameless"));
    writeFileSync(join(directory, "nameless", "SKILL.md"), "---\ndescription: No name\n---\nBody\n");

    const { ctx, skills } = createContext();
    const { registerSkills } = await import("../index.js");
    await registerSkills(ctx, directory);

    assert.deepEqual(
      skills.map((skill) => skill.id),
      ["good"],
    );
  } finally {
    console.warn = originalWarn;
    rmSync(directory, { recursive: true, force: true });
  }
});

test("setup resolves when V2 domains are missing", async () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    await assert.doesNotReject(() => plugin.setup({}));
  } finally {
    console.warn = originalWarn;
  }
});

test("registers javadocs when the location is unavailable", async () => {
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

test("injects the using-xenoterracide-agent-skills bootstrap once", async () => {
  const { ctx, getContextHook } = createContext();
  await plugin.setup(ctx);

  const event = {
    sessionID: "ses_1",
    messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }],
  };
  await getContextHook()(event);
  await getContextHook()(event);

  const text = event.messages[0].content[0].text;
  assert.equal(text.includes("xenoterracide-agent-skills/using-xenoterracide-agent-skills"), true);
  assert.equal(text.includes("`using-xenoterracide-agent-skills`"), true);
  assert.equal(
    event.messages[0].content.filter((part) =>
      part.text.includes("xenoterracide-agent-skills/using-xenoterracide-agent-skills"),
    ).length,
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

  const text = "prefix xenoterracide-agent-skills/using-xenoterracide-agent-skills suffix";
  const event = { sessionID: "ses_1", messages: [{ role: "user", content: [{ type: "text", text }] }] };
  await getContextHook()(event);

  assert.equal(event.messages[0].content.length, 1);
  assert.equal(event.messages[0].content[0].text, text);
});

test("does not look up the session when the marker already exists", async () => {
  const { ctx, getContextHook } = createContext();
  let lookups = 0;
  ctx.session.get = async () => {
    lookups += 1;
    return { id: "ses_1" };
  };
  await plugin.setup(ctx);

  const text = "prefix xenoterracide-agent-skills/using-xenoterracide-agent-skills suffix";
  const event = { sessionID: "ses_1", messages: [{ role: "user", content: [{ type: "text", text }] }] };
  await getContextHook()(event);

  assert.equal(lookups, 0);
});

test("preserves string user content when injecting the bootstrap", async () => {
  const { ctx, getContextHook } = createContext();
  await plugin.setup(ctx);

  const event = { sessionID: "ses_1", messages: [{ role: "user", content: "hello" }] };
  await getContextHook()(event);

  assert.equal(event.messages[0].content.length, 2);
  assert.equal(
    event.messages[0].content[0].text.includes("xenoterracide-agent-skills/using-xenoterracide-agent-skills"),
    true,
  );
  assert.equal(event.messages[0].content[1].text, "hello");
});

test("does not read git aliases or register the session hook when sessionInit is false", async () => {
  let runs = 0;
  const gitAliasRunner = () => {
    runs += 1;
    return { status: 0, stdout: "alias.sp status --porcelain=v1 --branch\n" };
  };
  const { ctx, getContextHook } = createContext({
    options: { sessionInit: false },
    gitAliasRunner,
  });
  await plugin.setup(ctx);

  assert.equal(runs, 0);
  assert.equal(getContextHook(), undefined);
});

test("formats parsed git aliases for injection", () => {
  const stdout = "alias.sp status --porcelain=v1 --branch\nalias.bc branch --show-current\n";
  const block = buildAliasBlock(parseGitAliasOutput(stdout));

  assert.match(block, /^Git aliases:/);
  assert.ok(block.includes("alias.sp status --porcelain=v1 --branch"));
  assert.ok(block.includes("alias.bc branch --show-current"));
  assert.ok(block.indexOf("alias.bc") < block.indexOf("alias.sp"));
});

test("injects git aliases from git config before the first user text", async () => {
  const stdout = "alias.sp status --porcelain=v1 --branch\nalias.bc branch --show-current\n";
  let runs = 0;
  const gitAliasRunner = (args) => {
    runs += 1;
    assert.deepEqual(args, ["config", "--get-regexp", "^alias\\."]);
    return { status: 0, stdout };
  };
  const { ctx, getContextHook } = createContext({ gitAliasRunner });
  await plugin.setup(ctx);

  assert.equal(runs, 1);

  const event = {
    sessionID: "ses_1",
    messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }],
  };
  await getContextHook()(event);

  const bootstrap = event.messages[0].content[0].text;
  assert.ok(bootstrap.includes("Git aliases:"));
  assert.ok(bootstrap.includes("alias.sp status --porcelain=v1 --branch"));
  assert.ok(bootstrap.indexOf("Git aliases:") < bootstrap.indexOf("alias.sp"));
  assert.equal(event.messages[0].content[1].text, "hello");
});

test("injects git aliases when no user message exists", async () => {
  const gitAliasRunner = () => ({
    status: 0,
    stdout: "alias.bc branch --show-current\n",
  });
  const { ctx, getContextHook } = createContext({ gitAliasRunner });
  await plugin.setup(ctx);

  const event = { sessionID: "ses_1", messages: [] };
  await getContextHook()(event);

  assert.equal(event.messages.length, 1);
  assert.equal(event.messages[0].role, "user");
  assert.ok(event.messages[0].content[0].text.includes("alias.bc branch --show-current"));
});

test("returns an empty map without warning when git has no aliases", () => {
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => warnings.push(args);
  try {
    assert.deepEqual(readGitAliases(() => ({ status: 1, stdout: "" })), new Map());
    assert.deepEqual(warnings, []);
  } finally {
    console.warn = originalWarn;
  }
});

test("returns undefined and warns when git config fails", () => {
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => warnings.push(args);
  try {
    assert.equal(readGitAliases(() => ({ status: 2, stdout: "", stderr: "fatal" })), undefined);
    assert.equal(warnings.length, 1);
  } finally {
    console.warn = originalWarn;
  }
});

test("returns undefined and warns when the alias runner throws", () => {
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => warnings.push(args);
  try {
    assert.equal(
      readGitAliases(() => {
        throw new Error("boom");
      }),
      undefined,
    );
    assert.equal(warnings.length, 1);
  } finally {
    console.warn = originalWarn;
  }
});

test("returns undefined and warns on malformed git alias output", () => {
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => warnings.push(args);
  try {
    assert.equal(
      readGitAliases(() => ({ status: 0, stdout: "alias.sp status\nbroken line\n" })),
      undefined,
    );
    assert.equal(warnings.length, 1);
  } finally {
    console.warn = originalWarn;
  }
});

test("injects no alias block when git has no aliases", async () => {
  const { ctx, getContextHook } = createContext();
  await plugin.setup(ctx);

  const event = {
    sessionID: "ses_1",
    messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }],
  };
  await getContextHook()(event);

  assert.equal(event.messages[0].content[0].text.includes("Git aliases:"), false);
});

test("warns once and injects no aliases when git config fails", async () => {
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => warnings.push(args);
  try {
    const gitAliasRunner = () => ({ status: 2, stdout: "", stderr: "fatal" });
    const { ctx, getContextHook } = createContext({ gitAliasRunner });
    await plugin.setup(ctx);

    const event = {
      sessionID: "ses_1",
      messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }],
    };
    await assert.doesNotReject(() => getContextHook()(event));

    assert.equal(warnings.length, 1);
    assert.equal(event.messages[0].content[0].text.includes("Git aliases:"), false);
  } finally {
    console.warn = originalWarn;
  }
});

test("does not inject aliases into child sessions", async () => {
  const gitAliasRunner = () => ({
    status: 0,
    stdout: "alias.sp status --porcelain=v1 --branch\n",
  });
  const { ctx, getContextHook } = createContext({ gitAliasRunner, parentID: "ses_parent" });
  await plugin.setup(ctx);

  const event = {
    sessionID: "ses_child",
    messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }],
  };
  await getContextHook()(event);

  assert.equal(event.messages[0].content[0].text, "hello");
});

test("classifies missing and conflicting curated aliases", async () => {
  const { classifyAliases } = await import("../index.js");
  const expectedNames = [
    "sync",
    "sp",
    "last",
    "lg",
    "ds",
    "dc",
    "c",
    "p",
    "pl",
    "bd",
    "bc",
    "nb",
    "wtl",
    "wta",
    "wtr",
    "wtp",
    "mainwt",
  ];
  const expectedValues = {
    sync: "fetch --all --prune --quiet",
    sp: "status --porcelain=v1 --branch",
    last: "log -1 --oneline",
    lg: "log --oneline --decorate",
    ds: "diff --stat",
    dc: "diff --check",
    c: "!git add -A && git commit --quiet -F -",
    p: "push --quiet",
    pl: "pull --quiet --ff-only",
    bd: "branch -D --quiet",
    bc: "branch --show-current",
    nb: "switch --quiet -c",
    wtl: "worktree list",
    wta: "worktree add --quiet",
    wtr: "worktree remove",
    wtp: "worktree prune",
    mainwt: '!git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel',
  };

  const { missing, conflicts } = classifyAliases(
    new Map([
      ["bc", "old value"],
      ["extra", "x"],
    ]),
  );

  assert.deepEqual(conflicts, [
    { name: "bc", current: "old value", curated: expectedValues.bc },
  ]);
  assert.deepEqual(
    missing.map(({ name }) => name),
    expectedNames.filter((name) => name !== "bc"),
  );
  for (const alias of missing) {
    assert.equal(alias.value, expectedValues[alias.name]);
  }
});
