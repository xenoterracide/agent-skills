// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { join } from "node:path";
import { it } from "vitest";

import { assertSkillLoads } from "../../../scripts/eval-helpers";

const javaClass = join(import.meta.dirname, "fixtures", "java-class");

it("triggers when tightening a checklist bullet", () => {
  assertSkillLoads(
    "tighten this checklist bullet: It is important to note that you should always run the tests before claiming done.",
    "hemingway",
  );
});

it("triggers when writing javadoc", () => {
  assertSkillLoads("write javadoc for Greeter.java", "hemingway", { fixture: javaClass });
});

it("triggers directly on pasted prose", () => {
  assertSkillLoads(
    "tighten this sentence: It is important to note that the tests should be run before you claim the work is done.",
    "hemingway",
    { first: true },
  );
});

// Same prompt as docs-creator's own case on purpose: this asserts the
// companion rule — docs-creator pulls hemingway in — not hemingway's trigger.
it("loads as a docs-creator companion on a skill reference", () => {
  assertSkillLoads("add a bullet to the git-workflow pull-request reference", "hemingway");
});
