// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
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

const ITERATIONS = readIterations();

type HarnessCommand = [cmd: string, args: string[]];

const HARNESSES: Record<string, (model: string, prompt: string, skills: string) => HarnessCommand> = {
  opencode: (model, prompt) => ["opencode", ["run", "--standalone", "-m", model, prompt]],
  kimi: (_model, prompt, skills) => ["kimi", ["-p", prompt, "--skills-dir", skills]],
};

let cachedHarness: string | undefined;

function detectHarness(): string {
  for (const harness of Object.keys(HARNESSES)) {
    try {
      execFileSync(harness, ["--version"], { stdio: "ignore" });
      return harness;
    } catch (error) {
      process.stderr.write(`harness "${harness}" unavailable: ${(error as Error).message}\n`);
    }
  }
  throw new Error(`no supported harness found (${Object.keys(HARNESSES).join(", ")})`);
}

function harness(): string {
  cachedHarness ??= detectHarness();
  return cachedHarness;
}

export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

export function detectSkills(output: string): string[] {
  return [...stripAnsi(output).matchAll(/→ Skill "([^"]+)"/g)].map((match) => match[1]);
}

export function detectSkill(output: string, name: string): boolean {
  return detectSkills(output).includes(name);
}

function transcript(output: string): string {
  const clean = stripAnsi(output);
  return clean.length > 2000 ? `…${clean.slice(-2000)}` : clean;
}

export function harnessError(output: string): string | undefined {
  return stripAnsi(output).match(
    /Policy budget exceeded|rate limit(?: exceeded)?|insufficient (?:credits|quota)/i,
  )?.[0];
}

export interface RunOptions {
  model?: string;
  fixture?: string;
}

function runPrompt(prompt: string, { model = MODEL, fixture }: RunOptions = {}): string {
  const current = harness();
  const dir = mkdtempSync(join(tmpdir(), "skill-evals-"));
  let configDir: string | undefined;
  try {
    configDir = mkdtempSync(join(tmpdir(), "skill-evals-config-"));
    cpSync(skillsDir, join(dir, "skills"), {
      recursive: true,
      filter: (source) => !relative(skillsDir, source).split(sep).includes("tests"),
    });
    cpSync(join(root, ".opencode"), join(dir, ".opencode"), { recursive: true });
    if (fixture) {
      if (!existsSync(fixture)) throw new Error(`fixture not found: ${fixture}`);
      for (const entry of readdirSync(fixture)) {
        cpSync(join(fixture, entry), join(dir, entry), { recursive: true });
      }
    }
    const [cmd, args] = HARNESSES[current](model, prompt, join(dir, "skills"));
    const result = spawnSync(cmd, args, {
      encoding: "utf8",
      cwd: dir,
      env: { ...process.env, XDG_CONFIG_HOME: configDir, PWD: dir },
      timeout: 360_000,
      maxBuffer: 64 * 1024 * 1024,
    });
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    const rejection = harnessError(output);
    if (rejection) throw new Error(`harness rejected the session: ${rejection}`);
    if (result.error) {
      // A failed or killed session still proves the trigger when its
      // transcript exists: keep it so the load line can be checked.
      if (output.trim().length > 0) return output;
      throw result.error;
    }
    return output;
  } finally {
    rmSync(dir, { recursive: true, force: true });
    if (configDir) rmSync(configDir, { recursive: true, force: true });
  }
}

export interface AssertOptions extends RunOptions {
  iterations?: number;
  run?: typeof runPrompt;
  first?: boolean;
}

export function assertSkillLoads(
  prompt: string,
  skill: string,
  { fixture, model = MODEL, iterations = ITERATIONS, run = runPrompt, first = false }: AssertOptions = {},
): void {
  for (let i = 0; i < iterations; i++) {
    const output = run(prompt, { model, fixture });
    const loaded = detectSkills(output);
    const label = `run ${i + 1}/${iterations}`;
    assert.ok(loaded.includes(skill), `${label}: skill "${skill}" did not load\n${transcript(output)}`);
    if (first) {
      assert.equal(
        loaded[0],
        skill,
        `${label}: expected "${skill}" to load first, got ${JSON.stringify(loaded)}\n${transcript(output)}`,
      );
    }
  }
}

export function assertContains(
  prompt: string,
  text: string,
  { fixture, model = MODEL, iterations = ITERATIONS, run = runPrompt }: AssertOptions = {},
): void {
  for (let i = 0; i < iterations; i++) {
    const output = stripAnsi(run(prompt, { model, fixture }));
    assert.ok(
      output.includes(text),
      `run ${i + 1}/${iterations}: output did not contain "${text}"\n${transcript(output)}`,
    );
  }
}
