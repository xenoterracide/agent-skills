// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from "vitest";

import {
  assertSkillBehavior,
  assertSkillLoads,
  detectReads,
  detectSkills,
  harnessError,
  stripAnsi,
} from "./eval-helpers";

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

  it("detects a free-tier rejection", () => {
    expect(harnessError("Error: Free usage limit reached. Free models work in OpenCode")).toBe(
      "Free usage limit reached",
    );
  });
});

describe("detectReads", () => {
  it("returns read paths in order", () => {
    expect(detectReads("→ Read skills/java-creator/SKILL.md\n→ Read .")).toEqual(["skills/java-creator/SKILL.md", "."]);
  });

  it("trims trailing whitespace from paths", () => {
    expect(detectReads("→ Read skills/hemingway/SKILL.md ")).toEqual(["skills/hemingway/SKILL.md"]);
  });

  it("ignores other tool lines", () => {
    expect(detectReads('✱ Grep "foo" 1 match\n→ Skill "java-creator"')).toEqual([]);
  });
});

describe("assertSkillBehavior", () => {
  const run = (): string => '→ Skill "java-creator"\n→ Read skills/java-creator/references/hibernate.md';

  it("passes when the skill loads and the reference is read", () => {
    expect(() => {
      assertSkillBehavior("p", "java-creator", { run, iterations: 1, reads: ["hibernate.md"] });
    }).not.toThrow();
  });

  it("passes with a RegExp read pattern", () => {
    expect(() => {
      assertSkillBehavior("p", "java-creator", { run, iterations: 1, reads: [/hibernate\.md$/] });
    }).not.toThrow();
  });

  it("fails when the reference is not read", () => {
    const runNoRead = (): string => '→ Skill "java-creator"';
    expect(() => {
      assertSkillBehavior("p", "java-creator", { run: runNoRead, iterations: 1, reads: ["hibernate.md"] });
    }).toThrow(/expected a Read matching/);
  });

  it("fails when the skill does not load", () => {
    const runNoSkill = (): string => "→ Read skills/java-creator/references/hibernate.md";
    expect(() => {
      assertSkillBehavior("p", "java-creator", { run: runNoSkill, iterations: 1, reads: ["hibernate.md"] });
    }).toThrow(/did not load/);
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
