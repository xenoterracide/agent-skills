// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import plugin, {
  DEFAULT_SKILLS_DIRECTORY,
  buildAliasBlock,
  buildInstallOffer,
  classifyAliases,
  curatedFingerprint,
  dismissalKey,
  isJavaProject,
  offerFingerprint,
  parseGitAliasOutput,
  readGitAliases,
} from "../index.js";

const EXPECTED_CURATED_ALIASES = [
  ["sync", "fetch --all --prune --quiet"],
  ["sp", "status --porcelain=v1 --branch"],
  ["last", "log -1 --oneline"],
  ["lg", "log --oneline --decorate"],
  ["ds", "diff --stat"],
  ["dc", "diff --check"],
  ["c", "!git add -A && git commit --quiet -F -"],
  ["p", "push --quiet"],
  ["pl", "pull --quiet --ff-only"],
  ["bd", "branch -D --quiet"],
  ["bc", "branch --show-current"],
  ["nb", "switch --quiet -c"],
  ["wtl", "worktree list"],
  ["wta", "worktree add --quiet"],
  ["wtr", "worktree remove"],
  ["wtp", "worktree prune"],
  ["mainwt", '!git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel'],
];
const EXPECTED_CURATED_NAMES = EXPECTED_CURATED_ALIASES.map(([name]) => name);
const EXPECTED_CURATED_VALUES = Object.fromEntries(EXPECTED_CURATED_ALIASES);

function createContext({
  options = {},
  existingSkills = [],
  existingMcp = {},
  gitAliasRunner = () => ({ status: 1, stdout: "" }),
  gitAliasWriter,
  storage = new Map(),
  parentID,
  rejectSkillIDs = [],
  location,
} = {}) {
  const skills = [...existingSkills];
  const mcp = new Map(Object.entries(existingMcp));
  const tools = [];
  const storageReads = [];
  let contextHook;
  let skillTransformCalls = 0;
  let mcpTransformCalls = 0;

  const ctx = {
    options: {
      ...options,
      gitAliases: {
        ...options.gitAliases,
        runner: gitAliasRunner,
        writer: gitAliasWriter ?? options.gitAliases?.writer,
      },
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
    tool: {
      async transform(callback) {
        callback({
          list: () => tools,
          get: (id) => tools.find((tool) => tool.name === id || tool.id === id),
          add: (tool) => tools.push(tool),
          update: () => {},
          remove: () => {},
        });
        return { dispose: async () => {} };
      },
      async list() {
        return tools;
      },
      async get(id) {
        return tools.find((tool) => tool.name === id || tool.id === id);
      },
    },
    storage: {
      async get(key) {
        storageReads.push(key);
        return storage.get(key);
      },
      async set(key, value) {
        storage.set(key, value);
      },
      async remove(key) {
        storage.delete(key);
      },
    },
  };

  return {
    ctx,
    skills,
    mcp,
    tools,
    storage,
    storageReads,
    getContextHook: () => contextHook,
    getTool: (id) => tools.find((tool) => tool.name === id || tool.id === id),
    getSkillTransformCalls: () => skillTransformCalls,
    getMcpTransformCalls: () => mcpTransformCalls,
  };
}

function createGitAliasWriter(response = { status: 0, stdout: "" }) {
  const calls = [];
  return {
    calls,
    writer: (args) => {
      calls.push(args);
      return response;
    },
  };
}

async function setupInstallTool({ gitAliasRunner, writer, options = {} } = {}) {
  const harness = createContext({ gitAliasRunner, gitAliasWriter: writer, options });
  await plugin.setup(harness.ctx);
  const tool = harness.getTool("install_git_aliases");
  assert.ok(tool, "install_git_aliases tool is registered");
  return { ...harness, tool };
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
    return { status: 0, stdout: "alias.sp\nstatus --porcelain=v1 --branch\0" };
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
  const stdout = "alias.sp\nstatus --porcelain=v1 --branch\0alias.bc\nbranch --show-current\0";
  const block = buildAliasBlock(parseGitAliasOutput(stdout));

  assert.match(block, /^Git aliases:/);
  assert.ok(block.includes("alias.sp status --porcelain=v1 --branch"));
  assert.ok(block.includes("alias.bc branch --show-current"));
  assert.ok(block.indexOf("alias.bc") < block.indexOf("alias.sp"));
});

test("adds an imperative to the injected alias block", () => {
  const stdout = "alias.sp\nstatus --porcelain=v1 --branch\0";
  const block = buildAliasBlock(parseGitAliasOutput(stdout));
  assert.match(block, /Use these aliases for every matching git command\. Do not expand them\./);
});

test("keeps injected aliases inside the importance wrapper", async () => {
  const gitAliasRunner = () => ({ status: 0, stdout: "alias.sp\nstatus --porcelain=v1 --branch\0" });
  const { ctx, getContextHook } = createContext({ gitAliasRunner });
  await plugin.setup(ctx);
  const event = { sessionID: "ses_1", messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }] };
  await getContextHook()(event);

  const bootstrap = event.messages[0].content[0].text;
  assert.ok(bootstrap.indexOf("Git aliases:") > -1);
  assert.ok(bootstrap.indexOf("Git aliases:") < bootstrap.indexOf("</EXTREMELY_IMPORTANT>"));
});

test("injects git aliases from git config before the first user text", async () => {
  const stdout = "alias.sp\nstatus --porcelain=v1 --branch\0alias.bc\nbranch --show-current\0";
  let runs = 0;
  const gitAliasRunner = (args) => {
    runs += 1;
    assert.deepEqual(args, ["config", "--null", "--get-regexp", "^alias\\."]);
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
    stdout: "alias.bc\nbranch --show-current\0",
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
    assert.deepEqual(
      readGitAliases(() => ({ status: 1, stdout: "" })),
      new Map(),
    );
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
    assert.equal(
      readGitAliases(() => ({ status: 2, stdout: "", stderr: "fatal" })),
      undefined,
    );
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
      readGitAliases(() => ({ status: 0, stdout: "alias.sp status\0" })),
      undefined,
    );
    assert.equal(warnings.length, 1);
  } finally {
    console.warn = originalWarn;
  }
});

test("parses multi-line alias values without dropping other aliases", () => {
  const aliases = parseGitAliasOutput(
    "alias.multi\necho one\nalias.fake nope\0alias.sp\nstatus --porcelain=v1 --branch\0",
  );

  assert.deepEqual(aliases.get("multi"), "echo one\nalias.fake nope");
  assert.deepEqual(aliases.get("sp"), "status --porcelain=v1 --branch");
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
    assert.equal(event.messages[0].content[0].text.includes("Install git aliases:"), false);
  } finally {
    console.warn = originalWarn;
  }
});

test("warns once and injects no offers when the alias runner throws", async () => {
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => warnings.push(args);
  try {
    const gitAliasRunner = () => {
      throw new Error("boom");
    };
    const { ctx, getContextHook } = createContext({ gitAliasRunner });
    await plugin.setup(ctx);

    const event = {
      sessionID: "ses_1",
      messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }],
    };
    await assert.doesNotReject(() => getContextHook()(event));

    assert.equal(warnings.length, 1);
    const bootstrap = event.messages[0].content[0].text;
    assert.equal(bootstrap.includes("Git aliases:"), false);
    assert.equal(bootstrap.includes("Install git aliases:"), false);
  } finally {
    console.warn = originalWarn;
  }
});

test("does not inject aliases into child sessions", async () => {
  const gitAliasRunner = () => ({
    status: 0,
    stdout: "alias.sp\nstatus --porcelain=v1 --branch\0",
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

test("classifies missing and conflicting curated aliases", () => {
  const { missing, conflicts } = classifyAliases(
    new Map([
      ["bc", "old value"],
      ["extra", "x"],
    ]),
  );

  assert.deepEqual(conflicts, [{ name: "bc", current: "old value", curated: EXPECTED_CURATED_VALUES.bc }]);
  assert.deepEqual(
    missing.map(({ name }) => name),
    EXPECTED_CURATED_NAMES.filter((name) => name !== "bc"),
  );
  for (const alias of missing) {
    assert.equal(alias.value, EXPECTED_CURATED_VALUES[alias.name]);
  }
});

test("builds an install offer listing every missing curated alias", () => {
  const offer = buildInstallOffer(classifyAliases(new Map()));

  assert.match(offer, /^Install git aliases:/);
  assert.match(offer, /^Missing:/m);
  for (const [name, value] of EXPECTED_CURATED_ALIASES) {
    assert.ok(offer.includes(`  ${name} = ${value}`), `offer omits ${name}`);
  }
});

test("builds an install offer showing current and curated values for conflicts", () => {
  const current = new Map(EXPECTED_CURATED_ALIASES);
  current.set("bc", "old branch");
  const offer = buildInstallOffer(classifyAliases(current));

  assert.match(offer, /^Conflicts:/m);
  assert.ok(offer.includes('  bc = current "old branch", curated "branch --show-current"'));
  assert.equal(offer.includes("  sp = "), false);
});

test("install offer explains confirmation, overwrite, and dismissal", () => {
  const offer = buildInstallOffer(classifyAliases(new Map()));

  assert.ok(offer.includes("install_git_aliases"));
  assert.match(offer, /confirm/i);
  assert.match(offer, /separate confirmation/i);
  assert.ok(offer.includes("dismiss: true"));
  assert.ok(offer.includes("confirm: true"));
});

test("setup and context injection never write git config", async () => {
  const { calls, writer } = createGitAliasWriter();
  const { ctx, getContextHook } = createContext({ gitAliasWriter: writer });
  await plugin.setup(ctx);

  const event = {
    sessionID: "ses_1",
    messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }],
  };
  await getContextHook()(event);

  assert.deepEqual(calls, []);
});

test("gitAliases.offer false injects aliases without an install offer", async () => {
  const gitAliasRunner = () => ({ status: 0, stdout: "alias.sp\nstatus --porcelain=v1 --branch\0" });
  const { ctx, getContextHook } = createContext({
    options: { gitAliases: { offer: false } },
    gitAliasRunner,
  });
  await plugin.setup(ctx);

  const event = {
    sessionID: "ses_1",
    messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }],
  };
  await getContextHook()(event);

  const bootstrap = event.messages[0].content[0].text;
  assert.ok(bootstrap.includes("alias.sp status --porcelain=v1 --branch"));
  assert.equal(bootstrap.includes("Install git aliases:"), false);
});

test("a stored dismissal suppresses the current install offer", async () => {
  const state = classifyAliases(new Map());
  const storage = new Map([[dismissalKey(state), true]]);
  const { ctx, getContextHook } = createContext({ storage });
  await plugin.setup(ctx);

  const event = {
    sessionID: "ses_1",
    messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }],
  };
  await getContextHook()(event);

  assert.equal(event.messages[0].content[0].text.includes("Install git aliases:"), false);
});

test("dismissal keys combine the curated and offer fingerprints", () => {
  const state = classifyAliases(new Map());

  assert.equal(dismissalKey(state), `gitAliases.dismissed.${curatedFingerprint()}.${offerFingerprint(state)}`);
});

test("curated fingerprint changes when curated values change", () => {
  const hash = (pairs) =>
    createHash("sha256")
      .update(JSON.stringify(pairs.map(([name, value]) => ({ name, value }))))
      .digest("hex");
  const altered = EXPECTED_CURATED_ALIASES.map(([name, value]) =>
    name === "bc" ? [name, "changed branch"] : [name, value],
  );

  assert.equal(curatedFingerprint(), hash(EXPECTED_CURATED_ALIASES));
  assert.notEqual(hash(altered), curatedFingerprint());
});

test("a changed conflicting set produces a new key and restores the offer", async () => {
  const emptyState = classifyAliases(new Map());
  const storage = new Map([[dismissalKey(emptyState), true]]);
  const first = createContext({ storage });
  await plugin.setup(first.ctx);

  const firstEvent = {
    sessionID: "ses_1",
    messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }],
  };
  await first.getContextHook()(firstEvent);
  assert.equal(firstEvent.messages[0].content[0].text.includes("Install git aliases:"), false);

  const conflictState = classifyAliases(new Map([["bc", "old branch"]]));
  assert.notEqual(dismissalKey(conflictState), dismissalKey(emptyState));

  const gitAliasRunner = () => ({ status: 0, stdout: "alias.bc\nold branch\0" });
  const second = createContext({ storage, gitAliasRunner });
  await plugin.setup(second.ctx);

  const secondEvent = {
    sessionID: "ses_2",
    messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }],
  };
  await second.getContextHook()(secondEvent);
  assert.ok(secondEvent.messages[0].content[0].text.includes("Install git aliases:"));
});

test("sessionInit false never reads storage for offers", async () => {
  const { ctx, storageReads } = createContext({ options: { sessionInit: false } });
  await plugin.setup(ctx);

  assert.deepEqual(storageReads, []);
});

test("confirmed aliases install as curated global git config", async () => {
  const { calls, writer } = createGitAliasWriter();
  const { tool } = await setupInstallTool({ writer });

  const result = await tool.execute({ confirm: true, aliases: ["sync", "sp"] });

  assert.deepEqual(calls, [
    ["config", "--global", "alias.sync", "fetch --all --prune --quiet"],
    ["config", "--global", "alias.sp", "status --porcelain=v1 --branch"],
  ]);
  assert.ok(result.content.includes("sync"));
  assert.ok(result.content.includes("sp"));
});

test("an alias already set to its curated value is not written", async () => {
  const { calls, writer } = createGitAliasWriter();
  const gitAliasRunner = () => ({ status: 0, stdout: "alias.sp\nstatus --porcelain=v1 --branch\0" });
  const { tool } = await setupInstallTool({ gitAliasRunner, writer });

  await tool.execute({ confirm: true, aliases: ["sync", "sp"] });

  assert.deepEqual(calls, [["config", "--global", "alias.sync", "fetch --all --prune --quiet"]]);
});

test("confirmation is required before any git config write", async () => {
  for (const input of [{ confirm: false, aliases: ["sync"] }, { aliases: ["sync"] }]) {
    const { calls, writer } = createGitAliasWriter();
    const { tool } = await setupInstallTool({ writer });

    await assert.rejects(() => tool.execute(input), /confirm/i);
    assert.deepEqual(calls, []);
  }
});

test("an empty alias list writes no git config", async () => {
  const { calls, writer } = createGitAliasWriter();
  const { tool } = await setupInstallTool({ writer });

  const result = await tool.execute({ confirm: true, aliases: [] });

  assert.deepEqual(calls, []);
  assert.match(result.content, /[Nn]o aliases/);
});

test("failed git config writes are reported without throwing", async () => {
  const { calls, writer } = createGitAliasWriter();
  const failingWriter = (args) => {
    writer(args);
    return args[2] === "alias.sp" ? { status: 1, stderr: "permission denied" } : { status: 0 };
  };
  const { tool } = await setupInstallTool({ writer: failingWriter });

  const result = await tool.execute({ confirm: true, aliases: ["sync", "sp"] });

  assert.equal(calls.length, 2);
  assert.match(result.content, /failed/i);
  assert.match(result.content, /sp/);
});

test("sessionInit false does not register the install tool", async () => {
  const { ctx, tools } = createContext({ options: { sessionInit: false } });
  await plugin.setup(ctx);

  assert.deepEqual(tools, []);
});

test("a failed alias read rejects installs before any git config write", async () => {
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => warnings.push(args);
  try {
    const { calls, writer } = createGitAliasWriter();
    const gitAliasRunner = () => ({ status: 2, stdout: "", stderr: "fatal" });
    const { tool } = await setupInstallTool({ gitAliasRunner, writer });

    await assert.rejects(() => tool.execute({ confirm: true, aliases: ["sync"] }), /read|alias/i);
    assert.deepEqual(calls, []);
    assert.equal(warnings.length, 1);
  } finally {
    console.warn = originalWarn;
  }
});

test("a conflicting alias in the install list is reported and not written", async () => {
  const { calls, writer } = createGitAliasWriter();
  const gitAliasRunner = () => ({ status: 0, stdout: "alias.bc\nold branch\0" });
  const { tool } = await setupInstallTool({ gitAliasRunner, writer });

  const result = await tool.execute({ confirm: true, aliases: ["bc", "sync"] });

  assert.deepEqual(calls, [["config", "--global", "alias.sync", "fetch --all --prune --quiet"]]);
  assert.match(result.content, /conflict/i);
  assert.match(result.content, /bc/);
});

test("an alias set after setup is treated as a conflict at install time", async () => {
  const { calls, writer } = createGitAliasWriter();
  let reads = 0;
  const gitAliasRunner = () => {
    reads += 1;
    return reads === 1 ? { status: 1, stdout: "" } : { status: 0, stdout: "alias.bc\ncustom branch\0" };
  };
  const { tool } = await setupInstallTool({ gitAliasRunner, writer });

  const result = await tool.execute({ confirm: true, aliases: ["bc", "sync"] });

  assert.deepEqual(calls, [["config", "--global", "alias.sync", "fetch --all --prune --quiet"]]);
  assert.match(result.content, /conflict/i);
  assert.match(result.content, /bc/);
});

test("a confirmed overwrite applies to a conflict created after setup", async () => {
  const { calls, writer } = createGitAliasWriter();
  let reads = 0;
  const gitAliasRunner = () => {
    reads += 1;
    return reads === 1 ? { status: 1, stdout: "" } : { status: 0, stdout: "alias.bc\ncustom branch\0" };
  };
  const { tool } = await setupInstallTool({ gitAliasRunner, writer });

  await tool.execute({ confirm: true, overwrite: [{ name: "bc", value: EXPECTED_CURATED_VALUES.bc }] });

  assert.deepEqual(calls, [["config", "--global", "alias.bc", "branch --show-current"]]);
});

test("a confirmed overwrite writes the curated value for a conflict", async () => {
  const { calls, writer } = createGitAliasWriter();
  const gitAliasRunner = () => ({ status: 0, stdout: "alias.bc\nold branch\0" });
  const { tool } = await setupInstallTool({ gitAliasRunner, writer });

  await tool.execute({ confirm: true, overwrite: [{ name: "bc", value: EXPECTED_CURATED_VALUES.bc }] });

  assert.deepEqual(calls, [["config", "--global", "alias.bc", "branch --show-current"]]);
});

test("invalid overwrite requests are rejected before any git config write", async () => {
  const gitAliasRunner = () => ({ status: 0, stdout: "alias.bc\nold branch\0" });
  const inputs = [
    { confirm: true, overwrite: [{ name: "bc", value: "wrong value" }] },
    { confirm: true, overwrite: [{ name: "not-curated", value: "anything" }] },
    { confirm: true, overwrite: [{ name: "sync", value: EXPECTED_CURATED_VALUES.sync }] },
    { overwrite: [{ name: "bc", value: EXPECTED_CURATED_VALUES.bc }] },
  ];

  for (const input of inputs) {
    const { calls, writer } = createGitAliasWriter();
    const { tool } = await setupInstallTool({ gitAliasRunner, writer });

    await assert.rejects(() => tool.execute(input));
    assert.deepEqual(calls, []);
  }
});

test("unknown aliases and non-global targets are rejected before any git config write", async () => {
  for (const input of [
    { confirm: true, aliases: ["not-curated"] },
    { confirm: true, target: "system", aliases: ["sync"] },
  ]) {
    const { calls, writer } = createGitAliasWriter();
    const { tool } = await setupInstallTool({ writer });

    await assert.rejects(() => tool.execute(input));
    assert.deepEqual(calls, []);
  }
});

test("an alias in both install and overwrite lists is rejected as ambiguous", async () => {
  const { calls, writer } = createGitAliasWriter();
  const gitAliasRunner = () => ({ status: 0, stdout: "alias.bc\nold branch\0" });
  const { tool } = await setupInstallTool({ gitAliasRunner, writer });

  await assert.rejects(
    () =>
      tool.execute({
        confirm: true,
        aliases: ["bc"],
        overwrite: [{ name: "bc", value: EXPECTED_CURATED_VALUES.bc }],
      }),
    /both/i,
  );
  assert.deepEqual(calls, []);
});

test("confirmed dismissal stores the key and writes no git config", async () => {
  const state = classifyAliases(new Map());
  const { calls, writer } = createGitAliasWriter();
  const { storage, tool, getContextHook } = await setupInstallTool({ writer });

  await tool.execute({ confirm: true, dismiss: true });

  assert.equal(storage.get(dismissalKey(state)), true);
  assert.deepEqual(calls, []);

  const event = {
    sessionID: "ses_1",
    messages: [{ role: "user", content: [{ type: "text", text: "hello" }] }],
  };
  await getContextHook()(event);
  assert.equal(event.messages[0].content[0].text.includes("Install git aliases:"), false);
});

test("dismissal without confirmation stores nothing", async () => {
  const { calls, writer } = createGitAliasWriter();
  const { storage, tool } = await setupInstallTool({ writer });

  await assert.rejects(() => tool.execute({ dismiss: true }), /confirm/i);

  assert.equal(storage.size, 0);
  assert.deepEqual(calls, []);
});
