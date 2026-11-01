// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import { join } from "node:path";
import test from "node:test";

import { assertSkillLoads } from "../../../scripts/eval-helpers.mjs";

const javaProject = join(import.meta.dirname, "fixtures", "java-project");

test("triggers on a natural request", { timeout: 300_000 }, () => {
  assertSkillLoads("modify the App class so the greeting is uppercase", "java-creator", { fixture: javaProject });
});
