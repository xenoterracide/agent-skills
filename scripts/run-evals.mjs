// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parse } from "yaml";

const root = join(import.meta.dirname, "..");
const evalsFile = join(root, "evals.yaml");

export function parseEvals(text) {
  return parse(text);
}

export function judgeContains(output, text) {
  return output.includes(text);
}

export function buildJudgePrompt(prompt, output, skill) {
  return [
    `Here is the output of an agent given this prompt: "${prompt}"`,
    "",
    output,
    "",
    `Did the agent invoke the "${skill}" skill and follow its instructions?`,
    'Answer with only "yes" or "no".',
  ].join("\n");
}

export function formatMatrix(results) {
  return results
    .map((r) => {
      const status = r.passed === r.total ? "PASS" : "FAIL";
      return `${status}  ${r.test}  [${r.model}]  ${r.passed}/${r.total}`;
    })
    .join("\n");
}

function runSession(model, prompt) {
  return execFileSync("opencode", ["run", "--standalone", "-m", model, prompt], {
    encoding: "utf8",
    cwd: root,
  });
}

function judgeSkill(model, prompt, output, skill) {
  const judgePrompt = buildJudgePrompt(prompt, output, skill);
  const judgeOutput = runSession(model, judgePrompt).trim().toLowerCase();
  return judgeOutput.startsWith("yes");
}

function main() {
  const evals = parseEvals(readFileSync(evalsFile, "utf8"));
  const results = [];
  for (const model of evals.models) {
    for (const test of evals.tests) {
      let passed = 0;
      for (let i = 0; i < evals.iterations; i++) {
        const output = runSession(model, test.prompt);
        const ok =
          test.expect.type === "contains"
            ? judgeContains(output, test.expect.text)
            : judgeSkill(model, test.prompt, output, test.expect.name);
        if (ok) passed++;
      }
      results.push({ test: test.name, model, passed, total: evals.iterations });
    }
  }
  console.log(formatMatrix(results));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
