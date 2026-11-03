// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { join } from "node:path";
import { it } from "vitest";

import { assertSkillLoads } from "../../../scripts/eval-helpers";

const gradleProject = join(import.meta.dirname, "fixtures", "gradle-project");

it("triggers on a natural request", () => {
  assertSkillLoads("add JUnit to the project", "gradle-creator", { fixture: gradleProject });
});
