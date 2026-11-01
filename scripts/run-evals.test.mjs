// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import test from "node:test";

import { buildJudgePrompt, formatMatrix, judgeContains, parseEvals, validateEvals } from "./run-evals.mjs";

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

test("parseEvals parses yaml", () => {
  const evals = parseEvals("models:\n  - m\niterations: 3\ntests: []\n");
  assert.deepEqual(evals.models, ["m"]);
  assert.equal(evals.iterations, 3);
});

test("validateEvals accepts a valid shape", () => {
  const evals = {
    models: ["m"],
    iterations: 3,
    tests: [{ name: "a", prompt: "p", expect: { type: "skill", name: "s" } }],
  };
  assert.doesNotThrow(() => validateEvals(evals));
});

test("validateEvals rejects a missing models list", () => {
  assert.throws(() => validateEvals({ iterations: 3, tests: [] }), /models/);
});

test("validateEvals rejects an unknown expect type", () => {
  const evals = {
    models: ["m"],
    iterations: 3,
    tests: [{ name: "a", prompt: "p", expect: { type: "bogus" } }],
  };
  assert.throws(() => validateEvals(evals), /bogus/);
});
