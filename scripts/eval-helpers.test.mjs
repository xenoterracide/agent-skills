// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import test from "node:test";

import { assertContains, assertSkillLoads, detectSkill, stripAnsi } from "./eval-helpers.mjs";

test("stripAnsi removes escape codes", () => {
  assert.equal(stripAnsi('\x1b[0m→ \x1b[0mSkill "hemingway"'), '→ Skill "hemingway"');
});

test("detectSkill finds a skill load event", () => {
  assert.equal(detectSkill('\x1b[0m→ \x1b[0mSkill "hemingway"', "hemingway"), true);
  assert.equal(detectSkill('\x1b[0m→ \x1b[0mSkill "hemingway"', "java-creator"), false);
});

test("assertSkillLoads passes when the skill loads every run", () => {
  const run = () => '→ Skill "hemingway"';
  assert.doesNotThrow(() => assertSkillLoads("p", "hemingway", { run, iterations: 3 }));
});

test("assertSkillLoads fails fast on a miss", () => {
  let calls = 0;
  const run = () => {
    calls += 1;
    return "";
  };
  assert.throws(() => assertSkillLoads("p", "hemingway", { run, iterations: 3 }), /did not load/);
  assert.equal(calls, 1);
});

test("assertContains fails fast when the text is missing", () => {
  let calls = 0;
  const run = () => {
    calls += 1;
    return "nope";
  };
  assert.throws(() => assertContains("p", "Run the tests", { run, iterations: 3 }), /did not contain/);
  assert.equal(calls, 1);
});
