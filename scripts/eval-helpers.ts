// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";

const root = join(import.meta.dirname, "..");
const skillsDir = join(root, "skills");

const MODEL = process.env.EVAL_MODEL ?? "opencode/glm-5.3";

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

export function stripAnsi(text: string): string {
  // ANSI escapes are control characters by definition.
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

export function detectSkills(output: string): string[] {
  return [...stripAnsi(output).matchAll(/→ Skill "([^"]+)"/g)].map((match) => match[1]);
}

export function detectReads(output: string): string[] {
  return [...stripAnsi(output).matchAll(/→ Read (.+)/g)].map((match) => match[1].trim());
}

// Tool invocations render with a marker prefix ($, →, ⚙, ✱, ←, ✓, ✗); the
// agent's prose does not. forbids scans these lines so a rule quoted in a
// refusal does not read as an invocation.
export function detectCommands(output: string): string[] {
  return stripAnsi(output)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[$→⚙✱←✓✗]/.test(line));
}

export function combineOutput(stdout: string | undefined, stderr: string | undefined): string {
  return `${stdout ?? ""}${stderr ?? ""}`;
}

function transcript(output: string): string {
  const clean = stripAnsi(output);
  return clean.length > 2000 ? `…${clean.slice(-2000)}` : clean;
}

export function harnessError(output: string): string | undefined {
  return /Policy budget exceeded|rate limit(?: exceeded)?|free usage limit reached|insufficient (?:credits|quota)/i.exec(
    stripAnsi(output),
  )?.[0];
}

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

// The stub shadows gh on the sandbox PATH. It answers the preflight an
// agent runs before creating a PR and accepts the create, so the flow
// completes without touching the network; argv is logged to gh.log. A
// named PR answers in an unsettled state — checks pending, policy blank —
// because a run the sandbox contradicts stops settling and starts
// investigating the sandbox itself.
export function writeGhStub(dir: string): void {
  const bin = join(dir, "bin");
  mkdirSync(bin);
  writeFileSync(
    join(bin, "gh"),
    [
      "#!/bin/sh",
      'log="$(dirname "$0")/../gh.log"',
      'printf \'%s\\n\' "$*" >>"$log"',
      'case "$1 $2" in',
      '  "auth status") echo "Logged in to github.com account fixture"; exit 0;;',
      '  "repo view")',
      '    case "$*" in',
      '      *--json*) echo \'{"defaultBranchRef":{"name":"main"},"nameWithOwner":"xenoterracide/fixture"}\';;',
      '      *) echo "xenoterracide/fixture";;',
      "    esac",
      "    exit 0;;",
      '  "pr view")',
      '    case "$*" in',
      "      *7*)",
      '        case "$*" in',
      '          *--json*) echo \'{"number":7,"url":"https://github.com/xenoterracide/fixture/pull/7","title":"feat: fixture","state":"OPEN","isDraft":false,"headRefName":"feat/fixture","baseRefName":"main","headRefOid":"0000000000000000000000000000000000000007","mergeable":null,"mergeStateStatus":"UNKNOWN","reviewDecision":"","statusCheckRollup":[{"__typename":"CheckRun","name":"check / check","status":"IN_PROGRESS"}]}\';;',
      '          *) printf \'%s\\n\' "feat: fixture" "state: OPEN" "base: main" "head: feat/fixture" "checks: check / check  pending";;',
      "        esac",
      "        exit 0;;",
      '      *) echo "no pull requests found" >&2; exit 1;;',
      "    esac;;",
      '  "pr checks")',
      '    case "$*" in',
      '      *--watch*) echo "check / check  pass";;',
      '      *) echo "check / check  pending"; exit 8;;',
      "    esac",
      "    exit 0;;",
      '  "pr create") echo "https://github.com/xenoterracide/fixture/pull/1"; exit 0;;',
      "esac",
      "exit 0",
      "",
    ].join("\n"),
    { mode: 0o755 },
  );
}

// The deny stub shadows gh for runs without a sandbox repo. The host gh is
// authenticated and the sandbox shares the host filesystem, so a run that
// wanders out can reach the real network; every gh call must fail as an
// unauthenticated gh would. argv is logged to gh.log.
export function writeGhDenyStub(dir: string): void {
  const bin = join(dir, "bin");
  mkdirSync(bin, { recursive: true });
  writeFileSync(
    join(bin, "gh"),
    [
      "#!/bin/sh",
      'log="$(dirname "$0")/../gh.log"',
      'printf \'%s\\n\' "$*" >>"$log"',
      'echo "You are not logged into any GitHub hosts. Run gh auth login to authenticate." >&2',
      "exit 1",
      "",
    ].join("\n"),
    { mode: 0o755 },
  );
}

// The stub shadows ghb on the sandbox PATH. A host ghb would reach the
// network from inside the sandbox. "green" and "blocked" answer pr verify
// with that policy state so the ghb path completes; "missing" fails like
// an absent binary, so the run takes the raw fallback. argv is logged to
// ghb.log.
export function writeGhbStub(dir: string, availability: "missing" | "green" | "blocked"): void {
  const bin = join(dir, "bin");
  mkdirSync(bin, { recursive: true });
  const verify =
    availability === "blocked"
      ? "PR #7: mergeStateStatus BLOCKED, reviewDecision CHANGES_REQUESTED — merge refused"
      : "PR #7: current, mergeable, checks green";
  const lines =
    availability === "missing"
      ? [
          "#!/bin/sh",
          'log="$(dirname "$0")/../ghb.log"',
          'printf \'%s\\n\' "$*" >>"$log"',
          'echo "ghb: command not found" >&2',
          "exit 127",
          "",
        ]
      : [
          "#!/bin/sh",
          'log="$(dirname "$0")/../ghb.log"',
          'printf \'%s\\n\' "$*" >>"$log"',
          'case "$1 $2" in',
          `  "pr verify") echo "${verify}"; exit 0;;`,
          "esac",
          "exit 0",
          "",
        ];
  writeFileSync(join(bin, "ghb"), lines.join("\n"), { mode: 0o755 });
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

export function runPrompt(prompt: string, { model = MODEL, fixture, repo, ghb = "missing" }: RunOptions = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "skill-evals-"));
  let configDir: string | undefined = undefined;
  try {
    configDir = mkdtempSync(join(tmpdir(), "skill-evals-config-"));
    cpSync(skillsDir, join(dir, "skills"), {
      recursive: true,
      filter: (source) => !relative(skillsDir, source).split(sep).includes("tests"),
    });
    cpSync(join(root, ".opencode"), join(dir, ".opencode"), { recursive: true });
    if (fixture !== undefined) {
      if (!existsSync(fixture)) throw new Error(`fixture not found: ${fixture}`);
      for (const entry of readdirSync(fixture)) {
        cpSync(join(fixture, entry), join(dir, entry), { recursive: true });
      }
    }
    if (repo === true) {
      initSandboxRepo(dir);
      writeGhStub(dir);
      writeGhbStub(dir, ghb);
    } else {
      writeGhDenyStub(dir);
    }
    const result = spawnSync("opencode", ["run", "--standalone", "-m", model, prompt], {
      encoding: "utf8",
      cwd: dir,
      env: {
        ...envWithoutTokens(),
        XDG_CONFIG_HOME: configDir,
        // An eval must not spend the host credentials. An isolated gh
        // config finds no hosts.yml, a nulled global gitconfig kills the
        // credential helper, and the stubbed bin/gh answers before any
        // absolute-path gh - one wander cost a real armed auto-merge.
        GH_CONFIG_DIR: join(configDir, "gh"),
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_CONFIG_SYSTEM: "/dev/null",
        PWD: dir,
        PATH: [join(dir, "bin"), process.env.PATH ?? ""].join(":"),
      },
      timeout: 480_000,
      maxBuffer: 64 * 1024 * 1024,
    });
    const output = combineOutput(result.stdout, result.stderr);
    const rejection = harnessError(output);
    if (rejection !== undefined) throw new Error(`harness rejected the session: ${rejection}`);
    if (result.error !== undefined) {
      // A failed or killed session still proves the trigger when its
      // transcript exists: keep it so the load line can be checked.
      if (output.trim().length > 0) return output;
      throw result.error;
    }
    return output;
  } finally {
    rmSync(dir, { recursive: true, force: true });
    if (configDir !== undefined) rmSync(configDir, { recursive: true, force: true });
  }
}

export interface AssertOptions extends RunOptions {
  iterations?: number;
  run?: typeof runPrompt;
  first?: boolean;
  /** Require the router's load event. False when the case asserts the facet
   * read instead — a companion can reach the facet by path without the
   * router firing. `first` requires this to stay true. */
  loadEvent?: boolean;
}

function pathMatches(reads: string[], pattern: string | RegExp): boolean {
  return reads.some((read) => (typeof pattern === "string" ? read.includes(pattern) : pattern.test(read)));
}

export interface BehaviorOptions extends AssertOptions {
  reads?: (string | RegExp)[];
  forbids?: (string | RegExp)[];
  commands?: (string | RegExp)[];
}

export function assertSkillBehavior(
  prompt: string,
  skill: string,
  {
    fixture,
    model = MODEL,
    iterations = ITERATIONS,
    run = runPrompt,
    first = false,
    loadEvent = true,
    reads = [],
    forbids = [],
    commands: commandPatterns = [],
    repo,
    ghb,
  }: BehaviorOptions = {},
): void {
  for (let i = 0; i < iterations; i++) {
    const output = run(prompt, { model, fixture, repo, ghb });
    const loaded = detectSkills(output);
    const label = `run ${String(i + 1)}/${String(iterations)}`;
    if (loadEvent) {
      assert.ok(loaded.includes(skill), `${label}: skill "${skill}" did not load\n${transcript(output)}`);
      if (first) {
        assert.equal(
          loaded[0],
          skill,
          `${label}: expected "${skill}" to load first, got ${JSON.stringify(loaded)}\n${transcript(output)}`,
        );
      }
    }
    const readPaths = detectReads(output);
    for (const pattern of reads) {
      assert.ok(
        pathMatches(readPaths, pattern),
        `${label}: expected a Read matching ${String(pattern)}, got ${JSON.stringify(readPaths)}\n${transcript(output)}`,
      );
    }
    const commands = detectCommands(output).join("\n");
    for (const pattern of forbids) {
      const hit = typeof pattern === "string" ? commands.includes(pattern) : pattern.test(commands);
      assert.ok(!hit, `${label}: forbidden ${String(pattern)} appeared in a command line\n${transcript(output)}`);
    }
    for (const pattern of commandPatterns) {
      const hit = typeof pattern === "string" ? commands.includes(pattern) : pattern.test(commands);
      assert.ok(hit, `${label}: expected a command matching ${String(pattern)}, got:\n${commands}`);
    }
  }
}

export function assertSkillLoads(prompt: string, skill: string, options: AssertOptions = {}): void {
  assertSkillBehavior(prompt, skill, options);
}
