// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { it } from "vitest";

import { assertSkillLoads } from "../../../scripts/eval-helpers";

it("triggers when editing a skill reference", () => {
  assertSkillLoads("add a bullet to the git-workflow pull-request reference", "docs-creator");
});

it("triggers when fixing skill frontmatter", () => {
  assertSkillLoads("add a description to this SKILL.md frontmatter: name: greeting-creator", "docs-creator");
});

it("triggers when updating README", () => {
  assertSkillLoads("add a troubleshooting section to the README", "docs-creator");
});
