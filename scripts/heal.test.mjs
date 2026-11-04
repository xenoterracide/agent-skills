// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const HOOKS = join(import.meta.dirname, "..", ".config", "git", "hooks");
const HEAL = join(HOOKS, "heal.sh");
const HOOKS_PATH = "config core.hooksPath .config/git/hooks";

const hasFlock = spawnSync("flock", ["--version"], { env: { PATH: process.env.PATH } }).status === 0;

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const gitShim = `#!/bin/sh
echo "$@" >> "$SHIM_LOG/git"
if [ "$1" = "rev-parse" ] && [ "$2" = "--git-dir" ]; then
  echo "$FAKE_GIT_DIR"
fi
`;

const toolShim = (tool, exit) => `#!/bin/sh
echo "$@" >> "$SHIM_LOG/${tool}"
exit ${exit}
`;

const makeFixture = ({ tools = ["asdf", "pnpm", "uv", "npm", "corepack", "git"], failing = {}, markers = [] } = {}) => {
  const root = mkdtempSync(join(tmpdir(), "heal-"));
  const bin = join(root, "bin");
  const log = join(root, "log");
  const gitDir = join(root, "gitdir");
  mkdirSync(bin);
  mkdirSync(log);
  mkdirSync(gitDir);
  for (const tool of tools) {
    writeFileSync(join(bin, tool), tool === "git" ? gitShim : toolShim(tool, failing[tool] ?? 0), { mode: 0o755 });
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

const envFor = (fixture, { withFlock = false, extra = {} } = {}) => ({
  PATH: withFlock ? `${fixture.bin}:${process.env.PATH}` : fixture.bin,
  SHIM_LOG: fixture.log,
  FAKE_GIT_DIR: fixture.gitDir,
  ...extra,
});

const runHeal = (fixture, opts = {}) =>
  spawnSync(fixture.heal, [], { cwd: opts.cwd ?? fixture.root, env: envFor(fixture, opts) });

const readLog = (fixture, tool) => {
  try {
    return readFileSync(join(fixture.log, tool), "utf8").trim();
  } catch {
    return undefined;
  }
};

test("no markers: only the hooksPath config runs", () => {
  const fixture = makeFixture();
  try {
    const result = runHeal(fixture);
    assert.equal(result.status, 0);
    assert.equal(readLog(fixture, "git"), HOOKS_PATH);
    for (const tool of ["asdf", "pnpm", "uv", "npm", "corepack"]) {
      assert.equal(readLog(fixture, tool), undefined, `${tool} must not run`);
    }
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("asdf install runs when .tool-versions exists", () => {
  const fixture = makeFixture({ markers: [".tool-versions"] });
  try {
    const result = runHeal(fixture);
    assert.equal(result.status, 0);
    assert.equal(readLog(fixture, "asdf"), "install");
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("a missing asdf warns and the rest still heals", () => {
  const fixture = makeFixture({
    tools: ["pnpm", "uv", "npm", "corepack", "git"],
    markers: [".tool-versions", "pnpm-lock.yaml"],
  });
  try {
    const result = runHeal(fixture);
    assert.equal(result.status, 0);
    assert.match(result.stderr.toString(), /asdf/);
    assert.equal(readLog(fixture, "pnpm"), "install --frozen-lockfile");
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("corepack present: enable runs, npm never called", () => {
  const fixture = makeFixture({ markers: ["package.json"] });
  try {
    const result = runHeal(fixture);
    assert.equal(result.status, 0);
    assert.match(readLog(fixture, "corepack"), /enable --install-directory/);
    assert.equal(readLog(fixture, "npm"), undefined);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("corepack absent: npm installs it and asdf reshims", () => {
  const fixture = makeFixture({
    tools: ["asdf", "pnpm", "uv", "npm", "git"],
    markers: ["package.json", ".tool-versions"],
  });
  try {
    const result = runHeal(fixture);
    assert.equal(result.status, 0);
    assert.equal(readLog(fixture, "npm"), "install --global corepack");
    assert.match(readLog(fixture, "asdf"), /reshim nodejs/);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("pnpm install gated by pnpm-lock.yaml", () => {
  const fixture = makeFixture({ markers: ["pnpm-lock.yaml"] });
  try {
    const result = runHeal(fixture);
    assert.equal(result.status, 0);
    assert.equal(readLog(fixture, "pnpm"), "install --frozen-lockfile");
    assert.equal(readLog(fixture, "uv"), undefined);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("uv sync gated by uv.lock", () => {
  const fixture = makeFixture({ markers: ["uv.lock"] });
  try {
    const result = runHeal(fixture);
    assert.equal(result.status, 0);
    assert.equal(readLog(fixture, "uv"), "sync --frozen");
    assert.equal(readLog(fixture, "pnpm"), undefined);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("CI skips healing entirely", () => {
  const fixture = makeFixture({ markers: [".tool-versions", "pnpm-lock.yaml", "uv.lock", "package.json"] });
  try {
    const result = runHeal(fixture, { extra: { CI: "1" } });
    assert.equal(result.status, 0);
    for (const tool of ["asdf", "pnpm", "uv", "npm", "corepack", "git"]) {
      assert.equal(readLog(fixture, tool), undefined, `${tool} must not run under CI`);
    }
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("a failed step does not stop the rest", () => {
  const fixture = makeFixture({ failing: { pnpm: 1 }, markers: ["pnpm-lock.yaml", "uv.lock"] });
  try {
    const result = runHeal(fixture);
    assert.equal(result.status, 0);
    assert.match(result.stderr.toString(), /pnpm/);
    assert.equal(readLog(fixture, "uv"), "sync --frozen");
    assert.equal(readLog(fixture, "git"), HOOKS_PATH);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("a held lock makes the heal skip", { skip: !hasFlock }, () => {
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
    assert.equal(result.status, 0);
    assert.match(result.stderr.toString(), /skipping/);
    assert.equal(readLog(fixture, "asdf"), undefined);
  } finally {
    holder.kill();
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("heals without flock on PATH", () => {
  const fixture = makeFixture({ markers: [".tool-versions"] });
  try {
    const result = runHeal(fixture);
    assert.equal(result.status, 0);
    assert.equal(readLog(fixture, "asdf"), "install");
    assert.equal(readLog(fixture, "git"), HOOKS_PATH);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("an unwritable lock dir heals without the lock", () => {
  const fixture = makeFixture({ markers: [".tool-versions"] });
  chmodSync(fixture.gitDir, 0o555);
  try {
    const result = runHeal(fixture, { withFlock: true });
    assert.equal(result.status, 0);
    assert.equal(readLog(fixture, "asdf"), "install");
  } finally {
    chmodSync(fixture.gitDir, 0o755);
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("checkout changing all three markers heals exactly once", () => {
  const root = mkdtempSync(join(tmpdir(), "heal-hook-"));
  const bin = join(root, "bin");
  const log = join(root, "log");
  mkdirSync(bin);
  mkdirSync(log);
  for (const tool of ["asdf", "pnpm", "uv", "npm", "corepack"]) {
    writeFileSync(join(bin, tool), toolShim(tool, 0), { mode: 0o755 });
  }
  const hooks = join(root, ".config", "git", "hooks");
  mkdirSync(hooks, { recursive: true });
  for (const file of ["heal.sh", "post-checkout", "post-merge"]) {
    copyFileSync(join(HOOKS, file), join(hooks, file));
  }
  const gitEnv = {
    PATH: `${bin}:${process.env.PATH}`,
    HOME: root,
    SHIM_LOG: log,
    GIT_AUTHOR_NAME: "test",
    GIT_AUTHOR_EMAIL: "test@example.com",
    GIT_COMMITTER_NAME: "test",
    GIT_COMMITTER_EMAIL: "test@example.com",
  };
  const git = (...args) => spawnSync("git", args, { cwd: root, env: gitEnv });
  const markers = [".tool-versions", "pnpm-lock.yaml", "uv.lock"];
  try {
    assert.equal(git("init", "-q").status, 0);
    for (const marker of markers) {
      writeFileSync(join(root, marker), "v1\n");
    }
    assert.equal(git("add", "-A").status, 0);
    assert.equal(git("commit", "-q", "-m", "base").status, 0);
    assert.equal(git("config", "core.hooksPath", ".config/git/hooks").status, 0);
    for (const marker of markers) {
      writeFileSync(join(root, marker), "v2\n");
    }
    assert.equal(git("add", "-A").status, 0);
    assert.equal(git("commit", "-q", "-m", "change").status, 0);
    const checkout = git("checkout", "-q", "HEAD~1");
    assert.equal(checkout.status, 0, checkout.stderr?.toString() ?? "");
    assert.equal(readLog({ log }, "asdf"), "install");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("runs from a subdirectory", () => {
  const fixture = makeFixture({ markers: [".tool-versions", "pnpm-lock.yaml"] });
  const docs = join(fixture.root, "docs");
  mkdirSync(docs);
  try {
    const result = runHeal(fixture, { cwd: docs });
    assert.equal(result.status, 0);
    assert.equal(readLog(fixture, "asdf"), "install");
    assert.equal(readLog(fixture, "pnpm"), "install --frozen-lockfile");
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});
