// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { spawn, spawnSync } from "node:child_process";
import type { SpawnSyncReturns } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const HOOKS = join(import.meta.dirname, "..", ".config", "git", "hooks");
const HEAL = join(HOOKS, "heal.sh");
const HOOKS_PATH = "config core.hooksPath .config/git/hooks";

const hasFlock = spawnSync("flock", ["--version"], { env: { PATH: process.env.PATH } }).status === 0;

const sleep = (ms: number): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

const gitShim = `#!/bin/sh
echo "$@" >> "$SHIM_LOG/git"
if [ "$1" = "rev-parse" ] && [ "$2" = "--git-dir" ]; then
  echo "$FAKE_GIT_DIR"
fi
`;

const toolShim = (tool: string, exit: string): string => `#!/bin/sh
echo "$@" >> "$SHIM_LOG/${tool}"
exit ${exit}
`;

interface Fixture {
  root: string;
  bin: string;
  log: string;
  gitDir: string;
  heal: string;
}

const makeFixture = ({
  tools = ["asdf", "pnpm", "uv", "npm", "corepack", "git"],
  failing = {},
  markers = [],
}: { tools?: string[]; failing?: Partial<Record<string, string>>; markers?: string[] } = {}): Fixture => {
  const root = mkdtempSync(join(tmpdir(), "heal-"));
  const bin = join(root, "bin");
  const log = join(root, "log");
  const gitDir = join(root, "gitdir");
  mkdirSync(bin);
  mkdirSync(log);
  mkdirSync(gitDir);
  for (const tool of tools) {
    writeFileSync(join(bin, tool), tool === "git" ? gitShim : toolShim(tool, failing[tool] ?? "0"), { mode: 0o755 });
  }
  for (const marker of markers) {
    writeFileSync(join(root, marker), "");
  }
  // heal.sh resolves the repo root from its own path, so each fixture gets
  // its own copy — otherwise the real repo's markers would drive the heal.
  const hooks = join(root, ".config", "git", "hooks");
  mkdirSync(hooks, { recursive: true });
  copyFileSync(HEAL, join(hooks, "heal.sh"));
  return { root, bin, log, gitDir, heal: join(hooks, "heal.sh") };
};

const envFor = (
  fixture: Fixture,
  { withFlock = false, extra = {} }: { withFlock?: boolean; extra?: Record<string, string> } = {},
): Record<string, string> => ({
  PATH: withFlock ? `${fixture.bin}:${process.env.PATH ?? ""}` : fixture.bin,
  SHIM_LOG: fixture.log,
  FAKE_GIT_DIR: fixture.gitDir,
  ...extra,
});

const runHeal = (
  fixture: Fixture,
  opts: { cwd?: string; withFlock?: boolean; extra?: Record<string, string> } = {},
): SpawnSyncReturns<Buffer> =>
  spawnSync(fixture.heal, [], { cwd: opts.cwd ?? fixture.root, env: envFor(fixture, opts) });

const readLog = (fixture: { log: string }, tool: string): string | undefined => {
  try {
    return readFileSync(join(fixture.log, tool), "utf8").trim();
  } catch {
    return undefined;
  }
};

describe("heal.sh", () => {
  describe("marker gating", () => {
    it("no markers: only the hooksPath config runs", () => {
      const fixture = makeFixture();
      try {
        const result = runHeal(fixture);
        expect(result.status).toBe(0);
        expect(readLog(fixture, "git")).toBe(HOOKS_PATH);
        for (const tool of ["asdf", "pnpm", "uv", "npm", "corepack"]) {
          expect(readLog(fixture, tool), `${tool} must not run`).toBeUndefined();
        }
      } finally {
        rmSync(fixture.root, { recursive: true, force: true });
      }
    });

    it("asdf install runs when .tool-versions exists", () => {
      const fixture = makeFixture({ markers: [".tool-versions"] });
      try {
        const result = runHeal(fixture);
        expect(result.status).toBe(0);
        expect(readLog(fixture, "asdf")).toBe("install");
      } finally {
        rmSync(fixture.root, { recursive: true, force: true });
      }
    });

    it("corepack present: enable runs, npm never called", () => {
      const fixture = makeFixture({ markers: ["package.json"] });
      try {
        const result = runHeal(fixture);
        expect(result.status).toBe(0);
        expect(readLog(fixture, "corepack")).toMatch(/enable --install-directory/);
        expect(readLog(fixture, "npm")).toBeUndefined();
      } finally {
        rmSync(fixture.root, { recursive: true, force: true });
      }
    });

    it("corepack absent: npm installs it and asdf reshims", () => {
      const fixture = makeFixture({
        tools: ["asdf", "pnpm", "uv", "npm", "git"],
        markers: ["package.json", ".tool-versions"],
      });
      try {
        const result = runHeal(fixture);
        expect(result.status).toBe(0);
        expect(readLog(fixture, "npm")).toBe("install --global corepack");
        expect(readLog(fixture, "asdf")).toMatch(/reshim nodejs/);
      } finally {
        rmSync(fixture.root, { recursive: true, force: true });
      }
    });

    it("pnpm install gated by pnpm-lock.yaml", () => {
      const fixture = makeFixture({ markers: ["pnpm-lock.yaml"] });
      try {
        const result = runHeal(fixture);
        expect(result.status).toBe(0);
        expect(readLog(fixture, "pnpm")).toBe("install --frozen-lockfile --reporter=silent");
        expect(readLog(fixture, "uv")).toBeUndefined();
      } finally {
        rmSync(fixture.root, { recursive: true, force: true });
      }
    });

    it("uv sync gated by uv.lock", () => {
      const fixture = makeFixture({ markers: ["uv.lock"] });
      try {
        const result = runHeal(fixture);
        expect(result.status).toBe(0);
        expect(readLog(fixture, "uv")).toBe("sync --frozen --quiet");
        expect(readLog(fixture, "pnpm")).toBeUndefined();
      } finally {
        rmSync(fixture.root, { recursive: true, force: true });
      }
    });
  });

  describe("failure tolerance", () => {
    it("a missing asdf warns and the rest still heals", () => {
      const fixture = makeFixture({
        tools: ["pnpm", "uv", "npm", "corepack", "git"],
        markers: [".tool-versions", "pnpm-lock.yaml"],
      });
      try {
        const result = runHeal(fixture);
        expect(result.status).toBe(0);
        expect(result.stderr.toString()).toMatch(/asdf/);
        expect(readLog(fixture, "pnpm")).toBe("install --frozen-lockfile --reporter=silent");
      } finally {
        rmSync(fixture.root, { recursive: true, force: true });
      }
    });

    it("a failed step does not stop the rest", () => {
      const fixture = makeFixture({ failing: { pnpm: "1" }, markers: ["pnpm-lock.yaml", "uv.lock"] });
      try {
        const result = runHeal(fixture);
        expect(result.status).toBe(0);
        expect(result.stderr.toString()).toMatch(/pnpm/);
        expect(readLog(fixture, "uv")).toBe("sync --frozen --quiet");
        expect(readLog(fixture, "git")).toBe(HOOKS_PATH);
      } finally {
        rmSync(fixture.root, { recursive: true, force: true });
      }
    });
  });

  describe("locking", () => {
    it.skipIf(!hasFlock)("a held lock makes the heal skip", () => {
      const fixture = makeFixture({ markers: [".tool-versions"] });
      const lock = join(fixture.gitDir, "heal.lock");
      const holder = spawn("flock", [lock, "sleep", "30"], { stdio: "ignore", env: { PATH: process.env.PATH } });
      try {
        for (let attempt = 0; attempt < 100; attempt++) {
          if (spawnSync("flock", ["-n", lock, "true"], { env: { PATH: process.env.PATH } }).status !== 0) {
            break;
          }
          sleep(20);
        }
        const result = runHeal(fixture, { withFlock: true, extra: { HEAL_LOCK_WAIT: "0" } });
        expect(result.status).toBe(0);
        expect(result.stderr.toString()).toMatch(/skipping/);
        expect(readLog(fixture, "asdf")).toBeUndefined();
      } finally {
        holder.kill();
        rmSync(fixture.root, { recursive: true, force: true });
      }
    });

    it("heals without flock on PATH", () => {
      const fixture = makeFixture({ markers: [".tool-versions"] });
      try {
        const result = runHeal(fixture);
        expect(result.status).toBe(0);
        expect(readLog(fixture, "asdf")).toBe("install");
        expect(readLog(fixture, "git")).toBe(HOOKS_PATH);
      } finally {
        rmSync(fixture.root, { recursive: true, force: true });
      }
    });

    it("an unwritable lock dir heals without the lock", () => {
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
    });
  });

  describe("entry points", () => {
    it("CI skips healing entirely", () => {
      const fixture = makeFixture({ markers: [".tool-versions", "pnpm-lock.yaml", "uv.lock", "package.json"] });
      try {
        const result = runHeal(fixture, { extra: { CI: "1" } });
        expect(result.status).toBe(0);
        for (const tool of ["asdf", "pnpm", "uv", "npm", "corepack", "git"]) {
          expect(readLog(fixture, tool), `${tool} must not run under CI`).toBeUndefined();
        }
      } finally {
        rmSync(fixture.root, { recursive: true, force: true });
      }
    });

    it("runs from a subdirectory", () => {
      const fixture = makeFixture({ markers: [".tool-versions", "pnpm-lock.yaml"] });
      const docs = join(fixture.root, "docs");
      mkdirSync(docs);
      try {
        const result = runHeal(fixture, { cwd: docs });
        expect(result.status).toBe(0);
        expect(readLog(fixture, "asdf")).toBe("install");
        expect(readLog(fixture, "pnpm")).toBe("install --frozen-lockfile --reporter=silent");
      } finally {
        rmSync(fixture.root, { recursive: true, force: true });
      }
    });

    it("checkout changing all three markers heals exactly once", () => {
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
      const gitEnv = {
        PATH: `${bin}:${process.env.PATH ?? ""}`,
        HOME: root,
        SHIM_LOG: log,
        GIT_AUTHOR_NAME: "test",
        GIT_AUTHOR_EMAIL: "test@example.com",
        GIT_COMMITTER_NAME: "test",
        GIT_COMMITTER_EMAIL: "test@example.com",
      };
      const git = (...args: string[]): SpawnSyncReturns<Buffer> => spawnSync("git", args, { cwd: root, env: gitEnv });
      const markers = [".tool-versions", "pnpm-lock.yaml", "uv.lock"];
      try {
        expect(git("init", "-q").status).toBe(0);
        for (const marker of markers) {
          writeFileSync(join(root, marker), "v1\n");
        }
        expect(git("add", "-A").status).toBe(0);
        expect(git("commit", "-q", "-m", "base").status).toBe(0);
        expect(git("config", "core.hooksPath", ".config/git/hooks").status).toBe(0);
        for (const marker of markers) {
          writeFileSync(join(root, marker), "v2\n");
        }
        expect(git("add", "-A").status).toBe(0);
        expect(git("commit", "-q", "-m", "change").status).toBe(0);
        const checkout = git("checkout", "-q", "HEAD~1");
        expect(checkout.status, checkout.stderr.toString()).toBe(0);
        expect(readLog({ log }, "asdf")).toBe("install");
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    });
  });
});
