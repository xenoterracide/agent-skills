// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { it } from "vitest";

import { assertSkillLoads } from "../../../scripts/eval-helpers";

it("triggers before a long test run", () => {
  assertSkillLoads("run the full test suite, it prints pages of output", "output-hygiene");
});

it("triggers before watching checks", () => {
  assertSkillLoads("open the PR and watch the checks until they finish", "output-hygiene");
});

it("triggers on a noisy commit hook", () => {
  assertSkillLoads("commit this — the pre-commit hook prints a wall of lint output", "output-hygiene");
});

// Companion case: git-workflow pulls output-hygiene in on its own tasks,
// with no verbosity vocabulary in the prompt to trigger it directly.
it("loads as a git-workflow companion on PR work", () => {
  assertSkillLoads("open a PR for this branch and update its description", "output-hygiene");
});
