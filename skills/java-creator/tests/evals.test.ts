// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { join } from "node:path";
import { it } from "vitest";

import { assertSkillLoads } from "../../../scripts/eval-helpers";

const javaProject = join(import.meta.dirname, "fixtures", "java-project");

it("triggers on a natural request", () => {
  assertSkillLoads("modify the App class so the greeting is uppercase", "java-creator", { fixture: javaProject });
});
