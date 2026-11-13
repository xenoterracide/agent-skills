// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { spawnSync } from "node:child_process";
import type { SpawnSyncReturns } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const HOOKS = join(import.meta.dirname, "..", ".config", "git", "hooks");
const HEAL = join(HOOKS, "heal.sh");
export const HOOKS_PATH = "config core.hooksPath .config/git/hooks";

const gitShim = `#!/bin/sh
echo "$@" >> "$SHIM_LOG/git"
if [ "$1" = "rev-parse" ] && [ "$2" = "--git-dir" ]; then
  echo "$FAKE_GIT_DIR"
fi
`;

export const toolShim = (tool: string, exit: string): string => `#!/bin/sh
echo "$@" >> "$SHIM_LOG/${tool}"
exit ${exit}
`;

export interface Fixture {
  root: string;
  bin: string;
  log: string;
  gitDir: string;
  heal: string;
}

export interface FixtureSetup {
  tools?: string[];
  failing?: Partial<Record<string, string>>;
  markers?: string[];
}

const writeShims = (bin: string, tools: string[], failing: Partial<Record<string, string>>): void => {
  for (const tool of tools) {
    writeFileSync(join(bin, tool), tool === "git" ? gitShim : toolShim(tool, failing[tool] ?? "0"), { mode: 0o755 });
  }
};

// heal.sh resolves the repo root from its own path, so each fixture gets
// its own copy — otherwise the real repo's markers would drive the heal.
const copyHeal = (root: string): string => {
  const hooks = join(root, ".config", "git", "hooks");
  mkdirSync(hooks, { recursive: true });
  const heal = join(hooks, "heal.sh");
  copyFileSync(HEAL, heal);
  return heal;
};

export const makeFixture = ({
  tools = ["asdf", "pnpm", "uv", "npm", "corepack", "git"],
  failing = {},
  markers = [],
}: FixtureSetup = {}): Fixture => {
  const root = mkdtempSync(join(tmpdir(), "heal-"));
  const bin = join(root, "bin");
  const log = join(root, "log");
  const gitDir = join(root, "gitdir");
  mkdirSync(bin);
  mkdirSync(log);
  mkdirSync(gitDir);
  writeShims(bin, tools, failing);
  for (const marker of markers) {
    writeFileSync(join(root, marker), "");
  }
  return { root, bin, log, gitDir, heal: copyHeal(root) };
};

export const withFixture = (setup: FixtureSetup, body: (fixture: Fixture) => void): void => {
  const fixture = makeFixture(setup);
  try {
    body(fixture);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
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

export const runHeal = (
  fixture: Fixture,
  opts: { cwd?: string; withFlock?: boolean; extra?: Record<string, string> } = {},
): SpawnSyncReturns<Buffer> =>
  spawnSync(fixture.heal, [], { cwd: opts.cwd ?? fixture.root, env: envFor(fixture, opts) });

export const readLog = (fixture: { log: string }, tool: string): string | undefined => {
  try {
    return readFileSync(join(fixture.log, tool), "utf8").trim();
  } catch {
    return undefined;
  }
};
