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
