// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parse } from "yaml";

const root = join(import.meta.dirname, "..");
const evalsFile = join(root, "evals.yaml");
const skillsDir = join(root, "skills");

export function parseEvals(text) {
  return parse(text);
}

export function validateConfig(config) {
  if (config.harness !== undefined && config.harness !== "opencode" && config.harness !== "kimi") {
    throw new Error("evals.yaml: 'harness' must be 'opencode' or 'kimi'");
  }
  if (!Array.isArray(config.models) || config.models.length === 0) {
    throw new Error("evals.yaml: 'models' must be a non-empty list");
  }
  if (!Number.isInteger(config.iterations) || config.iterations < 1) {
    throw new Error("evals.yaml: 'iterations' must be a positive integer");
  }
}

export function detectHarness() {
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

export function buildHarnessCommand(harness, model, prompt) {
  if (harness === "opencode") {
    return { cmd: "opencode", args: ["run", "--standalone", "-m", model, prompt] };
  }
  if (harness === "kimi") {
    return { cmd: "kimi", args: ["-p", prompt, "--skills-dir", skillsDir] };
  }
  throw new Error(`unknown harness: ${harness}`);
}

export function validateTest(test) {
  if (!test.name || !test.prompt || !test.expect) {
    throw new Error("a test is missing name, prompt, or expect");
  }
  if (test.expect.type !== "skill" && test.expect.type !== "contains") {
    throw new Error(`test '${test.name}' has unknown expect.type '${test.expect.type}'`);
  }
}

export function discoverTests(skillsDir) {
  const tests = [];
  for (const name of readdirSync(skillsDir).sort()) {
    const dir = join(skillsDir, name);
    if (!statSync(dir).isDirectory()) continue;
    const file = join(dir, "tests", "evals.yaml");
    if (!existsSync(file)) continue;
    const cases = parseEvals(readFileSync(file, "utf8"));
    for (const test of cases) {
      validateTest(test);
      const fixtureDir = test.fixture ? join(dir, "tests", "fixtures", test.fixture) : null;
      tests.push({ skill: name, test, fixtureDir });
    }
  }
  return tests;
}

export function judgeContains(output, text) {
  return output.includes(text);
}

export function stripAnsi(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

export function detectSkill(output, name) {
  return stripAnsi(output).includes(`Skill "${name}"`);
}

export function formatMatrix(results) {
  return results
    .map((r) => {
      const status = r.passed === r.total ? "PASS" : "FAIL";
      return `${status}  ${r.test}  [${r.model}]  ${r.passed}/${r.total}`;
    })
    .join("\n");
}

function runSession(harness, model, prompt, fixtureDir) {
  const dir = mkdtempSync(join(tmpdir(), "skill-evals-"));
  const configDir = mkdtempSync(join(tmpdir(), "skill-evals-config-"));
  try {
    cpSync(join(root, "skills"), join(dir, "skills"), { recursive: true });
    cpSync(join(root, ".opencode"), join(dir, ".opencode"), { recursive: true });
    if (fixtureDir && existsSync(fixtureDir)) {
      for (const entry of readdirSync(fixtureDir)) {
        cpSync(join(fixtureDir, entry), join(dir, entry), { recursive: true });
      }
    }
    const { cmd, args } = buildHarnessCommand(harness, model, prompt);
    return execFileSync(cmd, args, {
      encoding: "utf8",
      cwd: dir,
      env: { ...process.env, XDG_CONFIG_HOME: configDir },
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(configDir, { recursive: true, force: true });
  }
}

function main() {
  const config = parseEvals(readFileSync(evalsFile, "utf8"));
  validateConfig(config);
  const harness = config.harness ?? detectHarness();
  const tests = discoverTests(skillsDir);
  const models = harness === "opencode" ? config.models : [null];
  const results = [];
  let failed = false;
  for (const model of models) {
    for (const { skill, test, fixtureDir } of tests) {
      let passed = 0;
      for (let i = 0; i < config.iterations; i++) {
        const output = runSession(harness, model, test.prompt, fixtureDir);
        const ok =
          test.expect.type === "contains"
            ? judgeContains(output, test.expect.text)
            : detectSkill(output, test.expect.name);
        if (ok) passed++;
      }
      if (passed < config.iterations) failed = true;
      results.push({ test: `${skill}: ${test.name}`, model: model ?? harness, passed, total: config.iterations });
    }
  }
  console.log(formatMatrix(results));
  if (failed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
