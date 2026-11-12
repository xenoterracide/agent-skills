// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { join } from "node:path";
import { it } from "vitest";

import { assertSkillBehavior, assertSkillLoads } from "../../../scripts/eval-helpers";

const readme = join(import.meta.dirname, "fixtures", "readme");

it("triggers when editing a skill reference", () => {
  assertSkillLoads("add a bullet to the git-workflow pull-request reference", "docs-creator");
});

it("triggers when fixing skill frontmatter", () => {
  assertSkillLoads("add a description to this SKILL.md frontmatter: name: greeting-creator", "docs-creator");
});

it("triggers when updating README", () => {
  assertSkillLoads("add a troubleshooting section to the README", "docs-creator", { fixture: readme });
});

it("triggers when creating a new skill and reads the routed references", () => {
  assertSkillBehavior(
    "add a calver skill to this repo for bumping YY.M.MICRO versions; create skills/calver/SKILL.md and update AGENTS.md",
    "docs-creator",
    { reads: ["references/skill-creator.md", "references/agents-creator.md"] },
  );
});

it("triggers when editing AGENTS.md and reads the routed reference", () => {
  assertSkillBehavior("update AGENTS.md to say this repo uses CalVer YY.M.MICRO", "docs-creator", {
    reads: ["references/agents-creator.md"],
  });
});
