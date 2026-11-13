// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { writeGhDenyStub, writeGhStub, writeGhbStub } from "./eval-stubs";

const answersPreflightAndLogs = (): void => {
  const dir = mkdtempSync(join(tmpdir(), "sandbox-gh-"));
  try {
    writeGhStub(dir);
    const gh = (...args: string[]): ReturnType<typeof spawnSync> =>
      spawnSync(join(dir, "bin", "gh"), args, { encoding: "utf8" });
    expect(gh("auth", "status").stdout).toContain("Logged in");
    expect(gh("repo", "view", "--json", "defaultBranchRef").stdout).toContain("defaultBranchRef");
    expect(gh("pr", "view").status).toBe(1);
    const verify = gh("pr", "view", "7", "--json", "mergeStateStatus,reviewDecision");
    expect(verify.status).toBe(0);
    expect(verify.stdout).toContain('"mergeStateStatus":"UNKNOWN"');
    expect(gh("pr", "checks", "7").status).toBe(8);
    expect(gh("pr", "checks", "7", "--watch").stdout).toContain("pass");
    expect(gh("pr", "create", "--title", "x", "--body-file", "-").stdout).toContain("pull/1");
    expect(readFileSync(join(dir, "gh.log"), "utf8")).toContain("--body-file");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

describe("writeGhStub", () => {
  it("answers preflight and records argv", answersPreflightAndLogs);
});

const deniesEveryCall = (): void => {
  const dir = mkdtempSync(join(tmpdir(), "sandbox-gh-deny-"));
  try {
    writeGhDenyStub(dir);
    const result = spawnSync(join(dir, "bin", "gh"), ["pr", "view", "258", "--json", "state"], { encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("not logged into any GitHub hosts");
    expect(readFileSync(join(dir, "gh.log"), "utf8")).toContain("pr view 258");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

describe("writeGhDenyStub", () => {
  it("fails every call like an unauthenticated gh and records argv", deniesEveryCall);
});

const verifiesPolicyState = (): void => {
  const dir = mkdtempSync(join(tmpdir(), "sandbox-ghb-"));
  try {
    writeGhbStub(dir, "blocked");
    const ghb = (...args: string[]): ReturnType<typeof spawnSync> =>
      spawnSync(join(dir, "bin", "ghb"), args, { encoding: "utf8" });
    const verify = ghb("pr", "verify");
    expect(verify.status).toBe(0);
    expect(verify.stdout).toContain("CHANGES_REQUESTED");
    expect(readFileSync(join(dir, "ghb.log"), "utf8")).toContain("pr verify");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const failsLikeAbsentBinary = (): void => {
  const dir = mkdtempSync(join(tmpdir(), "sandbox-ghb-"));
  try {
    writeGhbStub(dir, "missing");
    const result = spawnSync(join(dir, "bin", "ghb"), ["pr", "verify"], { encoding: "utf8" });
    expect(result.status).toBe(127);
    expect(result.stderr).toContain("command not found");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

describe("writeGhbStub", () => {
  it("answers pr verify with the policy state and records argv", verifiesPolicyState);
  it("fails like an absent binary when missing", failsLikeAbsentBinary);
});
