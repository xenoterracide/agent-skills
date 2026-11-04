// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  assertSkillBehavior,
  assertSkillLoads,
  detectReads,
  detectSkills,
  harnessError,
  initSandboxRepo,
  stripAnsi,
  writeGhStub,
  type RunOptions,
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

  it("forwards repo to run", () => {
    let received: RunOptions | undefined;
    const capture = (_prompt: string, options?: RunOptions): string => {
      received = options;
      return '→ Skill "git-workflow"';
    };
    assertSkillBehavior("p", "git-workflow", { run: capture, iterations: 1, repo: true });
    expect(received?.repo).toBe(true);
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

describe("assertSkillBehavior forbids", () => {
  it("passes when no forbidden pattern appears", () => {
    const run = (): string => '→ Skill "git-workflow"\n$ git status';
    expect(() => {
      assertSkillBehavior("p", "git-workflow", { run, iterations: 1, forbids: [/gh pr merge/] });
    }).not.toThrow();
  });

  it("fails when a forbidden command appears in the transcript", () => {
    const run = (): string => '→ Skill "git-workflow"\n$ gh pr merge 216 --squash';
    expect(() => {
      assertSkillBehavior("p", "git-workflow", { run, iterations: 1, forbids: [/gh pr merge/] });
    }).toThrow(/forbidden/);
  });

  it("ignores a forbidden pattern quoted in prose", () => {
    const run = (): string =>
      '→ Skill "git-workflow"\nI will not run the MCP merge_pull_request tool without your explicit yes.';
    expect(() => {
      assertSkillBehavior("p", "git-workflow", { run, iterations: 1, forbids: [/merge_pull_request/] });
    }).not.toThrow();
  });

  it("fails when a tool invocation line contains the pattern", () => {
    const run = (): string => '→ Skill "git-workflow"\n⚙ execute {"tool":"merge_pull_request"}';
    expect(() => {
      assertSkillBehavior("p", "git-workflow", { run, iterations: 1, forbids: [/merge_pull_request/] });
    }).toThrow(/forbidden/);
  });
});

describe("initSandboxRepo", () => {
  it("builds a committed repo whose origin is a reachable bare repo", () => {
    const dir = mkdtempSync(join(tmpdir(), "sandbox-repo-"));
    try {
      writeFileSync(join(dir, "a.txt"), "a");
      initSandboxRepo(dir);
      const head = spawnSync("git", ["-C", dir, "rev-parse", "--verify", "HEAD"], { encoding: "utf8" });
      expect(head.status).toBe(0);
      const status = spawnSync("git", ["-C", dir, "status", "--porcelain"], { encoding: "utf8" });
      expect(status.stdout).toBe("");
      const push = spawnSync("git", ["-C", dir, "push", "-q", "origin", "main"], { encoding: "utf8" });
      expect(push.status).toBe(0);
      const remoteHead = spawnSync("git", ["-C", join(dir, "origin.git"), "rev-parse", "--verify", "refs/heads/main"], {
        encoding: "utf8",
      });
      expect(remoteHead.status).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("writeGhStub", () => {
  it("answers preflight and records argv", () => {
    const dir = mkdtempSync(join(tmpdir(), "sandbox-gh-"));
    try {
      writeGhStub(dir);
      const gh = (...args: string[]): ReturnType<typeof spawnSync> =>
        spawnSync(join(dir, "bin", "gh"), args, { encoding: "utf8" });
      expect(gh("auth", "status").stdout).toContain("Logged in");
      expect(gh("repo", "view", "--json", "defaultBranchRef").stdout).toContain("defaultBranchRef");
      expect(gh("pr", "view").status).toBe(1);
      expect(gh("pr", "create", "--title", "x", "--body-file", "-").stdout).toContain("pull/1");
      expect(readFileSync(join(dir, "gh.log"), "utf8")).toContain("--body-file");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
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
