// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { spawn, spawnSync } from "node:child_process";
import type { SpawnSyncReturns } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { HOOKS, HOOKS_PATH, makeFixture, readLog, runHeal, toolShim } from "./heal-helpers";
import type { Fixture, FixtureSetup } from "./heal-helpers";

const hasFlock = spawnSync("flock", ["--version"], { env: { PATH: process.env.PATH } }).status === 0;

const sleep = (ms: number): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

const withFixture = (setup: FixtureSetup, body: (fixture: Fixture) => void): void => {
  const fixture = makeFixture(setup);
  try {
    body(fixture);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
};

const awaitLock = (lock: string): void => {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (spawnSync("flock", ["-n", lock, "true"], { env: { PATH: process.env.PATH } }).status !== 0) return;
    sleep(20);
  }
};

const skipsWhenLockHeld = (): void => {
  const fixture = makeFixture({ markers: [".tool-versions"] });
  const lock = join(fixture.gitDir, "heal.lock");
  const holder = spawn("flock", [lock, "sleep", "30"], { stdio: "ignore", env: { PATH: process.env.PATH } });
  try {
    awaitLock(lock);
    const result = runHeal(fixture, { withFlock: true, extra: { HEAL_LOCK_WAIT: "0" } });
    expect(result.status).toBe(0);
    expect(result.stderr.toString()).toMatch(/skipping/);
    expect(readLog(fixture, "asdf")).toBeUndefined();
  } finally {
    holder.kill();
    rmSync(fixture.root, { recursive: true, force: true });
  }
};

const healsWithoutFlockOnPath = (): void => {
  withFixture({ markers: [".tool-versions"] }, (fixture) => {
    const result = runHeal(fixture);
    expect(result.status).toBe(0);
    expect(readLog(fixture, "asdf")).toBe("install");
    expect(readLog(fixture, "git")).toBe(HOOKS_PATH);
  });
};

const healsWithoutTheLock = (): void => {
  const fixture = makeFixture({ markers: [".tool-versions"] });
  chmodSync(fixture.gitDir, 0o555);
  try {
    const result = runHeal(fixture, { withFlock: true });
    expect(result.status).toBe(0);
    expect(readLog(fixture, "asdf")).toBe("install");
  } finally {
    chmodSync(fixture.gitDir, 0o755);
    rmSync(fixture.root, { recursive: true, force: true });
  }
};

describe("locking", () => {
  it.skipIf(!hasFlock)("a held lock makes the heal skip", skipsWhenLockHeld);
  it("heals without flock on PATH", healsWithoutFlockOnPath);
  it("an unwritable lock dir heals without the lock", healsWithoutTheLock);
});

const skipsHealingUnderCi = (): void => {
  withFixture({ markers: [".tool-versions", "pnpm-lock.yaml", "uv.lock", "package.json"] }, (fixture) => {
    const result = runHeal(fixture, { extra: { CI: "1" } });
    expect(result.status).toBe(0);
    for (const tool of ["asdf", "pnpm", "uv", "npm", "corepack", "git"]) {
      expect(readLog(fixture, tool), `${tool} must not run under CI`).toBeUndefined();
    }
  });
};

const healsFromSubdirectory = (): void => {
  withFixture({ markers: [".tool-versions", "package.json", "pnpm-lock.yaml"] }, (fixture) => {
    const docs = join(fixture.root, "docs");
    mkdirSync(docs);
    const result = runHeal(fixture, { cwd: docs });
    expect(result.status).toBe(0);
    expect(readLog(fixture, "asdf")).toBe("install");
    expect(readLog(fixture, "pnpm")).toBe("install --frozen-lockfile --reporter=silent");
  });
};

interface HookFixture {
  root: string;
  log: string;
  git: (...args: string[]) => SpawnSyncReturns<Buffer>;
}

const gitEnv = (bin: string, home: string, log: string): Record<string, string> => ({
  PATH: `${bin}:${process.env.PATH ?? ""}`,
  HOME: home,
  SHIM_LOG: log,
  GIT_AUTHOR_NAME: "test",
  GIT_AUTHOR_EMAIL: "test@example.com",
  GIT_COMMITTER_NAME: "test",
  GIT_COMMITTER_EMAIL: "test@example.com",
});

const makeHookFixture = (): HookFixture => {
  const root = mkdtempSync(join(tmpdir(), "heal-hook-"));
  const bin = join(root, "bin");
  const log = join(root, "log");
  mkdirSync(bin);
  mkdirSync(log);
  for (const tool of ["asdf", "pnpm", "uv", "npm", "corepack"]) {
    writeFileSync(join(bin, tool), toolShim(tool, "0"), { mode: 0o755 });
  }
  const hooks = join(root, ".config", "git", "hooks");
  mkdirSync(hooks, { recursive: true });
  for (const file of ["heal.sh", "post-checkout", "post-merge"]) {
    copyFileSync(join(HOOKS, file), join(hooks, file));
  }
  const git = (...args: string[]): SpawnSyncReturns<Buffer> =>
    spawnSync("git", args, { cwd: root, env: gitEnv(bin, root, log) });
  return { root, log, git };
};

const writeMarkers = (root: string, version: string): void => {
  for (const marker of [".tool-versions", "pnpm-lock.yaml", "uv.lock"]) {
    writeFileSync(join(root, marker), `${version}\n`);
  }
};

const commitMarkers = (fixture: HookFixture, version: string, message: string): void => {
  writeMarkers(fixture.root, version);
  expect(fixture.git("add", "-A").status).toBe(0);
  expect(fixture.git("commit", "-q", "-m", message).status).toBe(0);
};

const healsOncePerCheckout = (): void => {
  const fixture = makeHookFixture();
  try {
    expect(fixture.git("init", "-q").status).toBe(0);
    commitMarkers(fixture, "v1", "base");
    expect(fixture.git("config", "core.hooksPath", ".config/git/hooks").status).toBe(0);
    commitMarkers(fixture, "v2", "change");
    const checkout = fixture.git("checkout", "-q", "HEAD~1");
    expect(checkout.status, checkout.stderr.toString()).toBe(0);
    expect(readLog({ log: fixture.log }, "asdf")).toBe("install");
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
};

describe("entry points", () => {
  it("CI skips healing entirely", skipsHealingUnderCi);
  it("runs from a subdirectory", healsFromSubdirectory);
  it("checkout changing all three markers heals exactly once", healsOncePerCheckout);
});
