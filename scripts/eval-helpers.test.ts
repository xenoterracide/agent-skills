// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from "vitest";

import { assertSkillLoads, detectSkills, harnessError, stripAnsi } from "./eval-helpers";

describe("stripAnsi", () => {
  it("removes escape codes", () => {
    expect(stripAnsi('\x1b[0m→ \x1b[0mSkill "hemingway"')).toBe('→ Skill "hemingway"');
  });
});

describe("detectSkills", () => {
  it("returns skills in load order", () => {
    expect(detectSkills('→ Skill "docs-creator"\n→ Skill "hemingway"')).toEqual(["docs-creator", "hemingway"]);
  });

  it("ignores a bare mention in the answer", () => {
    expect(detectSkills('I used Skill "hemingway" for this.')).toEqual([]);
  });
});

describe("harnessError", () => {
  it("detects a provider rejection", () => {
    expect(harnessError("…\nError: Policy budget exceeded\n")).toBe("Policy budget exceeded");
    expect(harnessError("rate limit exceeded")).toBe("rate limit exceeded");
    expect(harnessError("clean transcript")).toBeUndefined();
  });
});

describe("assertSkillLoads", () => {
  it("passes when the skill loads every run", () => {
    const run = (): string => '→ Skill "hemingway"';
    expect(() => {
      assertSkillLoads("p", "hemingway", { run, iterations: 3 });
    }).not.toThrow();
  });

  it("fails fast on a miss", () => {
    let calls = 0;
    const run = (): string => {
      calls += 1;
      return "";
    };
    expect(() => {
      assertSkillLoads("p", "hemingway", { run, iterations: 3 });
    }).toThrow(/did not load/);
    expect(calls).toBe(1);
  });

  it("fails when another skill loads first", () => {
    const run = (): string => '→ Skill "docs-creator"\n→ Skill "hemingway"';
    expect(() => {
      assertSkillLoads("p", "hemingway", { run, iterations: 1, first: true });
    }).toThrow(/to load first/);
  });
});
