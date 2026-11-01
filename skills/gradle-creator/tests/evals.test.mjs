// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import { join } from "node:path";
import test from "node:test";

import { assertSkillLoads } from "../../../scripts/eval-helpers.mjs";

const gradleProject = join(import.meta.dirname, "fixtures", "gradle-project");

test("triggers on a natural request", { timeout: 300_000 }, () => {
  assertSkillLoads("add JUnit to the project", "gradle-creator", { fixture: gradleProject });
});
