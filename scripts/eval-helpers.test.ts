// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
  type BehaviorOptions,
  type RunOptions,
} from "./eval-helpers";

const assertPass = (skill: string, options: BehaviorOptions): void => {
  expect(() => {
    assertSkillBehavior("p", skill, { iterations: 1, ...options });
  }).not.toThrow();
};

const assertFail = (skill: string, options: BehaviorOptions, pattern: RegExp): void => {
  expect(() => {
    assertSkillBehavior("p", skill, { iterations: 1, ...options });
  }).toThrow(pattern);
};

const runJavaCreator = (): string => '→ Skill "java-creator"\n→ Read skills/java-creator/references/hibernate.md';

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

const passesOnLoadAndRead = (): void => {
  assertPass("java-creator", { run: runJavaCreator, reads: ["hibernate.md"] });
};

const forwardsRepoToRun = (): void => {
  let received: RunOptions | undefined;
  const capture = (_prompt: string, options?: RunOptions): string => {
    received = options;
    return '→ Skill "git-workflow"';
  };
  assertSkillBehavior("p", "git-workflow", { run: capture, iterations: 1, repo: true });
  expect(received?.repo).toBe(true);
};

const passesWithRegexPattern = (): void => {
  assertPass("java-creator", { run: runJavaCreator, reads: [/hibernate\.md$/] });
};

const failsWhenReferenceNotRead = (): void => {
  assertFail(
    "java-creator",
    { run: (): string => '→ Skill "java-creator"', reads: ["hibernate.md"] },
    /expected a Read matching/,
  );
};

const failsWhenSkillNotLoaded = (): void => {
  assertFail(
    "java-creator",
    { run: (): string => "→ Read skills/java-creator/references/hibernate.md", reads: ["hibernate.md"] },
    /did not load/,
  );
};

const passesWithoutLoadEvent = (): void => {
  assertPass("hemingway", {
    run: (): string => "→ Read skills/hemingway/references/prose.md",
    loadEvent: false,
    reads: ["prose.md"],
  });
};

const stillRequiresReads = (): void => {
  assertFail(
    "hemingway",
    { run: (): string => "→ Read skills/hemingway/SKILL.md", loadEvent: false, reads: ["prose.md"] },
    /expected a Read matching/,
  );
};

describe("assertSkillBehavior", () => {
  it("passes when the skill loads and the reference is read", passesOnLoadAndRead);
  it("forwards repo to run", forwardsRepoToRun);
  it("passes with a RegExp read pattern", passesWithRegexPattern);
  it("fails when the reference is not read", failsWhenReferenceNotRead);
  it("fails when the skill does not load", failsWhenSkillNotLoaded);
  it("passes without a load event when loadEvent is false", passesWithoutLoadEvent);
  it("still requires the reads when loadEvent is false", stillRequiresReads);
});

const forbidsCleanTranscript = (): void => {
  const run = (): string => '→ Skill "git-workflow"\n$ git status';
  assertPass("git-workflow", { run, forbids: [/gh pr merge/] });
};

const forbidsForbiddenCommand = (): void => {
  const run = (): string => '→ Skill "git-workflow"\n$ gh pr merge 216 --squash';
  assertFail("git-workflow", { run, forbids: [/gh pr merge/] }, /forbidden/);
};

const forbidsQuotedPattern = (): void => {
  const run = (): string =>
    '→ Skill "git-workflow"\nI will not run the MCP merge_pull_request tool without your explicit yes.';
  assertPass("git-workflow", { run, forbids: [/merge_pull_request/] });
};

const forbidsToolInvocation = (): void => {
  const run = (): string => '→ Skill "git-workflow"\n⚙ execute {"tool":"merge_pull_request"}';
  assertFail("git-workflow", { run, forbids: [/merge_pull_request/] }, /forbidden/);
};

describe("assertSkillBehavior forbids", () => {
  it("passes when no forbidden pattern appears", forbidsCleanTranscript);
  it("fails when a forbidden command appears in the transcript", forbidsForbiddenCommand);
  it("ignores a forbidden pattern quoted in prose", forbidsQuotedPattern);
  it("fails when a tool invocation line contains the pattern", forbidsToolInvocation);
});

describe("assertSkillBehavior commands", () => {
  it("passes when a required command appears", () => {
    const run = (): string => '→ Skill "using-xenoterracide-agent-skills"\n$ pnpm install --reporter=silent';
    assertPass("using-xenoterracide-agent-skills", { run, commands: [/pnpm install .*--reporter=silent/] });
  });

  it("fails when the required command is absent", () => {
    const run = (): string => '→ Skill "using-xenoterracide-agent-skills"\n$ pnpm install';
    assertFail(
      "using-xenoterracide-agent-skills",
      { run, commands: [/--reporter=silent/] },
      /expected a command matching/,
    );
  });
});

const buildsPushableRepo = (): void => {
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
};

describe("initSandboxRepo", () => {
  it("builds a committed repo whose origin is a reachable bare repo", buildsPushableRepo);
});

const loadsEveryRun = (): void => {
  assertPass("hemingway", { run: (): string => '→ Skill "hemingway"', iterations: 3 });
};

const failsFastOnMiss = (): void => {
  let calls = 0;
  const run = (): string => {
    calls += 1;
    return "";
  };
  expect(() => {
    assertSkillLoads("p", "hemingway", { run, iterations: 3 });
  }).toThrow(/did not load/);
  expect(calls).toBe(1);
};

const failsWhenOtherSkillFirst = (): void => {
  const run = (): string => '→ Skill "docs-creator"\n→ Skill "hemingway"';
  expect(() => {
    assertSkillLoads("p", "hemingway", { run, iterations: 1, first: true });
  }).toThrow(/to load first/);
};

describe("assertSkillLoads", () => {
  it("passes when the skill loads every run", loadsEveryRun);
  it("fails fast on a miss", failsFastOnMiss);
  it("fails when another skill loads first", failsWhenOtherSkillFirst);
});
