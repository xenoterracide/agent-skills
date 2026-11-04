// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
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
}

export function runPrompt(prompt: string, { model = MODEL, fixture }: RunOptions = {}): string {
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
    const result = spawnSync("opencode", ["run", "--standalone", "-m", model, prompt], {
      encoding: "utf8",
      cwd: dir,
      env: { ...process.env, XDG_CONFIG_HOME: configDir, PWD: dir },
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
}

function pathMatches(reads: string[], pattern: string | RegExp): boolean {
  return reads.some((read) => (typeof pattern === "string" ? read.includes(pattern) : pattern.test(read)));
}

export interface BehaviorOptions extends AssertOptions {
  reads?: (string | RegExp)[];
  forbids?: (string | RegExp)[];
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
    reads = [],
    forbids = [],
  }: BehaviorOptions = {},
): void {
  for (let i = 0; i < iterations; i++) {
    const output = run(prompt, { model, fixture });
    const loaded = detectSkills(output);
    const label = `run ${String(i + 1)}/${String(iterations)}`;
    assert.ok(loaded.includes(skill), `${label}: skill "${skill}" did not load\n${transcript(output)}`);
    if (first) {
      assert.equal(
        loaded[0],
        skill,
        `${label}: expected "${skill}" to load first, got ${JSON.stringify(loaded)}\n${transcript(output)}`,
      );
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
  }
}

export function assertSkillLoads(prompt: string, skill: string, options: AssertOptions = {}): void {
  assertSkillBehavior(prompt, skill, options);
}
