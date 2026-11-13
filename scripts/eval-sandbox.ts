// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { spawnSync } from "node:child_process";
import type { SpawnSyncReturns } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";

import { combineOutput, harnessError } from "./eval-output";
import { writeGhDenyStub, writeGhStub, writeGhbStub } from "./eval-stubs";

const root = join(import.meta.dirname, "..");
const skillsDir = join(root, "skills");

export const MODEL = process.env.EVAL_MODEL ?? "opencode/glm-5.3";

function readIterations(): number {
  const raw = process.env.EVAL_ITERATIONS;
  if (raw === undefined) return 3;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`EVAL_ITERATIONS must be a positive integer, got "${raw}"`);
  }
  return value;
}

export const ITERATIONS = readIterations();

export interface RunOptions {
  model?: string;
  fixture?: string;
  repo?: boolean;
  /** ghb availability in the sandbox. The sandbox inherits the host PATH,
   * where a real ghb reaches the network; shadow it. "missing" (default)
   * shadows ghb as an absent binary, so the run takes the raw fallback;
   * "green" and "blocked" answer pr verify with that policy state. */
  ghb?: "missing" | "green" | "blocked";
}

// Evals that need a repository opt in with repo: true. Git cannot track a
// nested .git directory, so the repo is built here instead of shipped as a
// fixture. The origin is a bare repo inside the sandbox: pushes succeed,
// but the remote is a local path, so nothing outside the sandbox is
// reachable.
export function initSandboxRepo(dir: string): void {
  const git = (...args: string[]): void => {
    const result = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
    }
  };
  const origin = join(dir, "origin.git");
  writeFileSync(join(dir, ".gitignore"), "origin.git/\n");
  git("init", "-q", "--bare", origin);
  git("init", "-q", "-b", "main");
  git("add", "-A");
  git("-c", "user.name=skill evals", "-c", "user.email=skill-evals@example.invalid", "commit", "-qm", "fixture");
  git("remote", "add", "origin", origin);
}

// Tokens ride the environment as well as hosts.yml; the sandbox shares the
// host process environment, so strip what an eval never needs.
function envWithoutTokens(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.GH_TOKEN;
  delete env.GITHUB_TOKEN;
  delete env.GH_ENTERPRISE_TOKEN;
  return env;
}

interface Sandbox {
  dir: string;
  tools: string;
  config: string;
}

function copySandboxContent(dir: string, fixture: string | undefined): void {
  cpSync(skillsDir, join(dir, "skills"), {
    recursive: true,
    filter: (source) => !relative(skillsDir, source).split(sep).includes("tests"),
  });
  cpSync(join(root, ".opencode"), join(dir, ".opencode"), { recursive: true });
  if (fixture === undefined) return;
  if (!existsSync(fixture)) throw new Error(`fixture not found: ${fixture}`);
  for (const entry of readdirSync(fixture)) {
    cpSync(join(fixture, entry), join(dir, entry), { recursive: true });
  }
}

function writeSandboxStubs(tools: string, { repo, ghb }: { repo: boolean; ghb: RunOptions["ghb"] }): void {
  if (repo) {
    writeGhStub(tools);
    writeGhbStub(tools, ghb ?? "missing");
  } else {
    writeGhDenyStub(tools);
  }
}

// An eval must not spend the host credentials. An isolated gh config finds
// no hosts.yml, a nulled global gitconfig kills the credential helper, and
// the stubbed gh answers before any absolute-path gh — one wander cost a
// real armed auto-merge.
function opencodeEnv({ dir, tools, config }: Sandbox): NodeJS.ProcessEnv {
  return {
    ...envWithoutTokens(),
    XDG_CONFIG_HOME: config,
    GH_CONFIG_DIR: join(config, "gh"),
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
    PWD: dir,
    PATH: [join(tools, "bin"), process.env.PATH ?? ""].join(":"),
  };
}

function spawnOpencode(prompt: string, model: string, sandbox: Sandbox): SpawnSyncReturns<string> {
  return spawnSync("opencode", ["run", "--standalone", "-m", model, prompt], {
    encoding: "utf8",
    cwd: sandbox.dir,
    env: opencodeEnv(sandbox),
    timeout: 480_000,
    maxBuffer: 64 * 1024 * 1024,
  });
}

function sessionOutput(result: SpawnSyncReturns<string>): string {
  const output = combineOutput(result.stdout, result.stderr);
  const rejection = harnessError(output);
  if (rejection !== undefined) throw new Error(`harness rejected the session: ${rejection}`);
  if (result.error === undefined) return output;
  // A failed or killed session still proves the trigger when its
  // transcript exists: keep it so the load line can be checked.
  if (output.trim().length > 0) return output;
  throw result.error;
}

// The sandbox must read as a working copy, not a fixture. A cwd named
// "skill-evals", or a bin/ and gh.log sitting in the repo root, tell a run
// it lives inside an eval; the runs that notice stop trusting the prompt's
// premise — one read the stub scripts and never called ghb. So: neutral
// dir names, and the stubs with their logs live next door, on the PATH but
// out of the sandbox.
export function runPrompt(prompt: string, { model = MODEL, fixture, repo, ghb = "missing" }: RunOptions = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "work-"));
  const tools = mkdtempSync(join(tmpdir(), "tools-"));
  let config: string | undefined;
  try {
    config = mkdtempSync(join(tmpdir(), "config-"));
    copySandboxContent(dir, fixture);
    writeSandboxStubs(tools, { repo: repo === true, ghb });
    return sessionOutput(spawnOpencode(prompt, model, { dir, tools, config }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(tools, { recursive: true, force: true });
    if (config !== undefined) rmSync(config, { recursive: true, force: true });
  }
}
