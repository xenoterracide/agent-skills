// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { it } from "vitest";

import { assertSkillLoads } from "../../../scripts/eval-helpers";

it("triggers on the repo's calver wording", () => {
  assertSkillLoads("this repo uses calver YY.M.MICRO", "calver");
});

it("triggers when bumping a calver version", () => {
  assertSkillLoads("bump the version from 26.11.5 for this month's release", "calver");
});

it("triggers when asking for the next calver version", () => {
  assertSkillLoads("current version is 26.11.6, what's the next calver version?", "calver");
});

it("triggers on zero-padded month questions", () => {
  assertSkillLoads("should I use 0M or M in a calver version like 26.05.0?", "calver");
});
