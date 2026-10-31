// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

test("setup resolves when V2 domains are missing", async () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    await assert.doesNotReject(() => plugin.setup({}));
  } finally {
    console.warn = originalWarn;
  }
});

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
