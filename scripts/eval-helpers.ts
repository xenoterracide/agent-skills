// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const skillsDir = join(root, "skills");

const MODEL = process.env.EVAL_MODEL ?? "opencode/deepseek-v4.1-flash";
const ITERATIONS = Number(process.env.EVAL_ITERATIONS ?? "3");

type HarnessCommand = [cmd: string, args: string[]];

const HARNESSES: Record<string, (model: string, prompt: string) => HarnessCommand> = {
  opencode: (model, prompt) => ["opencode", ["run", "--standalone", "-m", model, prompt]],
  kimi: (_model, prompt) => ["kimi", ["-p", prompt, "--skills-dir", skillsDir]],
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

export function detectSkill(output: string, name: string): boolean {
  return stripAnsi(output).includes(`Skill "${name}"`);
}

export interface RunOptions {
  model?: string;
  fixture?: string;
}

function runPrompt(prompt: string, { model = MODEL, fixture }: RunOptions = {}): string {
  const current = harness();
  const dir = mkdtempSync(join(tmpdir(), "skill-evals-"));
  const configDir = mkdtempSync(join(tmpdir(), "skill-evals-config-"));
  try {
    cpSync(skillsDir, join(dir, "skills"), { recursive: true });
    cpSync(join(root, ".opencode"), join(dir, ".opencode"), { recursive: true });
    if (fixture && existsSync(fixture)) {
      for (const entry of readdirSync(fixture)) {
        cpSync(join(fixture, entry), join(dir, entry), { recursive: true });
      }
    }
    const [cmd, args] = HARNESSES[current](model, prompt);
    const result = spawnSync(cmd, args, {
      encoding: "utf8",
      cwd: dir,
      env: { ...process.env, XDG_CONFIG_HOME: configDir, PWD: dir },
      timeout: 360_000,
    });
    if (result.error) throw result.error;
    return `${result.stdout ?? ""}${result.stderr ?? ""}`;
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(configDir, { recursive: true, force: true });
  }
}

export interface AssertOptions extends RunOptions {
  iterations?: number;
  run?: typeof runPrompt;
}

export function assertSkillLoads(
  prompt: string,
  skill: string,
  { fixture, model = MODEL, iterations = ITERATIONS, run = runPrompt }: AssertOptions = {},
): void {
  for (let i = 0; i < iterations; i++) {
    const output = run(prompt, { model, fixture });
    assert.ok(detectSkill(output, skill), `run ${i + 1}/${iterations}: skill "${skill}" did not load`);
  }
}

export function assertContains(
  prompt: string,
  text: string,
  { fixture, model = MODEL, iterations = ITERATIONS, run = runPrompt }: AssertOptions = {},
): void {
  for (let i = 0; i < iterations; i++) {
    const output = run(prompt, { model, fixture });
    assert.ok(output.includes(text), `run ${i + 1}/${iterations}: output did not contain "${text}"`);
  }
}
