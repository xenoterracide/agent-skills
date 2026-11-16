// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { join } from "node:path";
import { it } from "vitest";

import { assertSkillBehavior, assertSkillLoads } from "../../../scripts/eval-helpers";

const tsFixture = join(import.meta.dirname, "fixtures", "ts");

it("running commands: triggers before a long test run", () => {
  assertSkillBehavior("run the full test suite, it prints pages of output", "running-commands", {
    reads: ["references/quiet.md"],
  });
});

// The trigger is this case's claim; the settle behavior is asserted by
// the checklist pipeline case. Do not re-add the command assertion.
it("running commands: triggers before watching checks", () => {
  assertSkillLoads("open the PR and watch the checks until they finish", "running-commands", { repo: true });
});

it("running commands: triggers on a noisy commit hook", () => {
  assertSkillBehavior("commit this — the pre-commit hook prints a wall of lint output", "running-commands", {
    reads: ["references/quiet.md"],
  });
});

// Companion case: git-workflow pulls running-commands in on its own tasks,
// with no command-ownership vocabulary in the prompt to trigger it directly.
it("running commands: loads as a git-workflow companion on PR work", () => {
  assertSkillLoads("open a PR for this branch and update its description", "running-commands", { repo: true });
});

// Ownership cases: goal phrasing routes through the owner instead of the
// agent running another row's commands standalone. Forbids scan tool lines,
// which render with a marker — shell commands carry `$`, reads carry `→`.
// Anchor on `$` so reading the config (`→ Read .prettierrc.yml`) is not
// mistaken for running the tool.
it("running commands: routes formatting goals through the commit hook", () => {
  assertSkillBehavior("clean up the formatting in src/foo.ts", "running-commands", {
    fixture: tsFixture,
    repo: true,
    forbids: [/\$ .*prettier\b(?!\.)/, /\$ .*shfmt\b/, /\$ .*reuse annotate\b/],
  });
});

it("running commands: routes lint goals through the push hooks", () => {
  assertSkillBehavior("make sure lint passes before we push", "running-commands", {
    repo: true,
    forbids: [/\$ .*eslint\b(?!\.)/, /\$ .*pnpm lint\b/, /\$ .*checkstyle(?!\.)/],
  });
});

it("running commands: routes license checks to CI", () => {
  assertSkillBehavior("check the license headers are compliant", "running-commands", {
    fixture: tsFixture,
    repo: true,
    forbids: [/\$ .*reuse (?:lint|annotate)\b/],
  });
});

it("running commands: runs its own targeted test only", () => {
  assertSkillBehavior("run the test you just wrote for the parser", "running-commands", {
    fixture: tsFixture,
    forbids: [/\$ .*pnpm test(?!:)/, /\$ .*pnpm evals\b/],
  });
});
