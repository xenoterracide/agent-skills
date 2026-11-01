// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import test from "node:test";

import { detectSkill, stripAnsi } from "./eval-helpers.mjs";

test("stripAnsi removes escape codes", () => {
  assert.equal(stripAnsi('\x1b[0m→ \x1b[0mSkill "hemingway"'), '→ Skill "hemingway"');
});

test("detectSkill finds a skill load event", () => {
  assert.equal(detectSkill('\x1b[0m→ \x1b[0mSkill "hemingway"', "hemingway"), true);
  assert.equal(detectSkill('\x1b[0m→ \x1b[0mSkill "hemingway"', "java-creator"), false);
});
