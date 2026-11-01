// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import test from "node:test";

import { assertSkillLoads } from "../../../scripts/eval-helpers.mjs";

test("triggers when editing a skill reference", { timeout: 300_000 }, () => {
  assertSkillLoads("add a bullet to the git-workflow pull-request reference", "docs-creator");
});

test("triggers when editing a SKILL.md", { timeout: 300_000 }, () => {
  assertSkillLoads("update the hemingway skill instructions", "docs-creator");
});

test("triggers when updating README", { timeout: 300_000 }, () => {
  assertSkillLoads("add a troubleshooting section to the README", "docs-creator");
});
