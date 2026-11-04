// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { join } from "node:path";
import { it } from "vitest";

import { assertSkillBehavior, assertSkillLoads } from "../../../scripts/eval-helpers";

const gradleProject = join(import.meta.dirname, "fixtures", "gradle-project");

it("triggers on a natural request", () => {
  assertSkillLoads("add JUnit to the project", "gradle-creator", { fixture: gradleProject });
});

// Guards the reference split: the shadow error must route to shadow.md.
it("loads and reads shadow.md on the minimize NPE", () => {
  assertSkillBehavior(
    'the shadow jar task fails with Cannot read field "forJava" because "parsedFileName" is null',
    "gradle-creator",
    { reads: [/shadow\.md$/] },
  );
});
