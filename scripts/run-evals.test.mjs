// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildHarnessCommand,
  buildJudgePrompt,
  discoverTests,
  formatMatrix,
  judgeContains,
  parseEvals,
  validateConfig,
  validateTest,
} from "./run-evals.mjs";

test("formatMatrix marks 3/3 as PASS", () => {
  const out = formatMatrix([{ test: "a", model: "m", passed: 3, total: 3 }]);
  assert.match(out, /PASS/);
  assert.match(out, /3\/3/);
});

test("formatMatrix marks 2/3 as FAIL", () => {
  const out = formatMatrix([{ test: "a", model: "m", passed: 2, total: 3 }]);
  assert.match(out, /FAIL/);
  assert.match(out, /2\/3/);
});

test("judgeContains matches a substring", () => {
  assert.equal(judgeContains('var foo = "foo"', "var foo"), true);
  assert.equal(judgeContains('var foo = "foo"', "String foo"), false);
});

test("buildJudgePrompt asks a yes/no question", () => {
  const prompt = buildJudgePrompt("p", "o", "java-creator");
  assert.match(prompt, /java-creator/);
  assert.match(prompt, /yes.*no/s);
});

test("buildHarnessCommand builds the opencode command", () => {
  const { cmd, args } = buildHarnessCommand("opencode", "opencode/deepseek-v4.1-flash", "p");
  assert.equal(cmd, "opencode");
  assert.deepEqual(args.slice(0, 5), ["run", "--standalone", "-m", "opencode/deepseek-v4.1-flash", "p"]);
});

test("buildHarnessCommand builds the kimi command", () => {
  const { cmd, args } = buildHarnessCommand("kimi", null, "p");
  assert.equal(cmd, "kimi");
  assert.deepEqual(args.slice(0, 3), ["-p", "p", "--skills-dir"]);
});

test("parseEvals parses yaml", () => {
  const evals = parseEvals("models:\n  - m\niterations: 3\n");
  assert.deepEqual(evals.models, ["m"]);
  assert.equal(evals.iterations, 3);
});

test("validateConfig accepts a valid config", () => {
  assert.doesNotThrow(() => validateConfig({ models: ["m"], iterations: 3 }));
});

test("validateConfig rejects a missing models list", () => {
  assert.throws(() => validateConfig({ iterations: 3 }), /models/);
});

test("validateTest accepts a valid test", () => {
  assert.doesNotThrow(() => validateTest({ name: "a", prompt: "p", expect: { type: "skill", name: "s" } }));
});

test("validateTest rejects an unknown expect type", () => {
  assert.throws(() => validateTest({ name: "a", prompt: "p", expect: { type: "bogus" } }), /bogus/);
});

test("discoverTests finds per-skill evals", () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-evals-"));
  try {
    mkdirSync(join(dir, "alpha", "tests"), { recursive: true });
    writeFileSync(
      join(dir, "alpha", "tests", "evals.yaml"),
      "- name: a\n  prompt: p\n  expect:\n    type: skill\n    name: alpha\n",
    );
    mkdirSync(join(dir, "beta"), { recursive: true });
    writeFileSync(join(dir, "beta", "SKILL.md"), "");

    const tests = discoverTests(dir);
    assert.equal(tests.length, 1);
    assert.equal(tests[0].skill, "alpha");
    assert.equal(tests[0].test.name, "a");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
