// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from "vitest";

import { assertContains, assertSkillLoads, detectSkill, stripAnsi } from "./eval-helpers";

describe("stripAnsi", () => {
  it("removes escape codes", () => {
    expect(stripAnsi('\x1b[0m→ \x1b[0mSkill "hemingway"')).toBe('→ Skill "hemingway"');
  });
});

describe("detectSkill", () => {
  it("finds a skill load event", () => {
    expect(detectSkill('\x1b[0m→ \x1b[0mSkill "hemingway"', "hemingway")).toBe(true);
    expect(detectSkill('\x1b[0m→ \x1b[0mSkill "hemingway"', "java-creator")).toBe(false);
  });
});

describe("assertSkillLoads", () => {
  it("passes when the skill loads every run", () => {
    const run = () => '→ Skill "hemingway"';
    expect(() => assertSkillLoads("p", "hemingway", { run, iterations: 3 })).not.toThrow();
  });

  it("fails fast on a miss", () => {
    let calls = 0;
    const run = () => {
      calls += 1;
      return "";
    };
    expect(() => assertSkillLoads("p", "hemingway", { run, iterations: 3 })).toThrow(/did not load/);
    expect(calls).toBe(1);
  });
});

describe("assertContains", () => {
  it("fails fast when the text is missing", () => {
    let calls = 0;
    const run = () => {
      calls += 1;
      return "nope";
    };
    expect(() => assertContains("p", "Run the tests", { run, iterations: 3 })).toThrow(/did not contain/);
    expect(calls).toBe(1);
  });
});
