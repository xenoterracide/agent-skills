// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const skillsDir = join(root, "skills");

const MODEL = process.env.EVAL_MODEL ?? "opencode/deepseek-v4.1-flash";
const ITERATIONS = Number(process.env.EVAL_ITERATIONS ?? "3");

function detectHarness() {
  for (const harness of ["opencode", "kimi"]) {
    try {
      execFileSync(harness, ["--version"], { stdio: "ignore" });
      return harness;
    } catch {
      // try the next harness
    }
  }
  throw new Error("no supported harness found (opencode or kimi)");
}

const HARNESS = detectHarness();

function buildCommand(model, prompt) {
  if (HARNESS === "opencode") {
    return ["opencode", ["run", "--standalone", "-m", model, prompt]];
  }
  return ["kimi", ["-p", prompt, "--skills-dir", skillsDir]];
}

export function stripAnsi(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

export function detectSkill(output, name) {
  return stripAnsi(output).includes(`Skill "${name}"`);
}

function runPrompt(prompt, { model = MODEL, fixture } = {}) {
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
    const [cmd, args] = buildCommand(model, prompt);
    const result = spawnSync(cmd, args, {
      encoding: "utf8",
      cwd: dir,
      env: { ...process.env, XDG_CONFIG_HOME: configDir, PWD: dir },
      timeout: 180_000,
    });
    if (result.error) throw result.error;
    return `${result.stdout ?? ""}${result.stderr ?? ""}`;
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(configDir, { recursive: true, force: true });
  }
}

export function assertSkillLoads(prompt, skill, { fixture, model = MODEL, iterations = ITERATIONS } = {}) {
  for (let i = 0; i < iterations; i++) {
    const output = runPrompt(prompt, { model, fixture });
    assert.ok(detectSkill(output, skill), `run ${i + 1}/${iterations}: skill "${skill}" did not load`);
  }
}

export function assertContains(prompt, text, { fixture, model = MODEL, iterations = ITERATIONS } = {}) {
  for (let i = 0; i < iterations; i++) {
    const output = runPrompt(prompt, { model, fixture });
    assert.ok(output.includes(text), `run ${i + 1}/${iterations}: output did not contain "${text}"`);
  }
}
